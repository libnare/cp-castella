/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Brackets } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { NotesRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { QueryService } from '@/core/QueryService.js';
import { NoteEntityService } from '@/core/entities/NoteEntityService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['users', 'notes'],

	description: 'Show all notes that this user created.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'Note',
		},
	},

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '27e494ba-2ac2-48e8-893b-10d4d8c2387b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		withReplies: { type: 'boolean', default: false },
		withRenotes: { type: 'boolean', default: true },
		withCats: { type: 'boolean', default: false },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sinceId: { type: 'string', format: 'misskey:id' },
		untilId: { type: 'string', format: 'misskey:id' },
		sinceDate: { type: 'integer' },
		untilDate: { type: 'integer' },
		includeMyRenotes: { type: 'boolean', default: true },
		withFiles: { type: 'boolean', default: false },
		fileType: { type: 'array', items: {
			type: 'string',
		} },
		excludeNsfw: { type: 'boolean', default: false },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.notesRepository)
		private notesRepository: NotesRepository,

		private noteEntityService: NoteEntityService,
		private queryService: QueryService,
		private getterService: GetterService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Lookup user
			const user = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
				throw err;
			});

			//#region Construct query
			const query = this.queryService.makePaginationQuery(this.notesRepository.createQueryBuilder('note'), ps.sinceId, ps.untilId, ps.sinceDate, ps.untilDate)
				.andWhere('note.userId = :userId', { userId: user.id })
				.innerJoinAndSelect('note.user', 'user')
				.leftJoinAndSelect('note.reply', 'reply')
				.leftJoinAndSelect('note.renote', 'renote')
				.leftJoinAndSelect('note.channel', 'channel')
				.leftJoinAndSelect('reply.user', 'replyUser')
				.leftJoinAndSelect('renote.user', 'renoteUser');

			query.andWhere(new Brackets(qb => {
				qb.orWhere('note.channelId IS NULL');
				qb.orWhere('channel.isSensitive = false');
			}));

			this.queryService.generateVisibilityQuery(query, me);
			if (me) {
				this.queryService.generateMutedUserQuery(query, me, user);
				this.queryService.generateBlockedUserQuery(query, me);
			}

			if (ps.withFiles) {
				query.andWhere('note.fileIds != \'{}\'');
			}

			if (ps.fileType != null) {
				query.andWhere('note.fileIds != \'{}\'');
				query.andWhere(new Brackets(qb => {
					for (const type of ps.fileType!) {
						const i = ps.fileType!.indexOf(type);
						qb.orWhere(`:type${i} = ANY(note.attachedFileTypes)`, { [`type${i}`]: type });
					}
				}));

				if (ps.excludeNsfw) {
					query.andWhere('note.cw IS NULL');
					query.andWhere('0 = (SELECT COUNT(*) FROM drive_file df WHERE df.id = ANY(note."fileIds") AND df."isSensitive" = TRUE)');
				}
			}

			if (!ps.withReplies) {
				query.andWhere('note.replyId IS NULL');
			}

			if (ps.withRenotes === false) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.renoteId IS NULL');
					qb.orWhere(new Brackets(qb => {
						qb.orWhere('note.text IS NOT NULL');
						qb.orWhere('note.fileIds != \'{}\'');
					}));
				}));
			}

			if (ps.includeMyRenotes === false) {
				query.andWhere(new Brackets(qb => {
					qb.orWhere('note.userId != :userId', { userId: user.id });
					qb.orWhere('note.renoteId IS NULL');
					qb.orWhere('note.text IS NOT NULL');
					qb.orWhere('note.fileIds != \'{}\'');
					qb.orWhere('0 < (SELECT COUNT(*) FROM poll WHERE poll."noteId" = note.id)');
				}));
			}

			if (ps.withCats) {
				query.andWhere('(select "isCat" from "user" where id = note."userId")');
			}

			//#endregion

			const timeline = await query.limit(ps.limit).getMany();

			return await this.noteEntityService.packMany(timeline, me);
		});
	}
}
