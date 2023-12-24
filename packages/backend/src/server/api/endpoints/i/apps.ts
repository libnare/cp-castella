/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AccessTokensRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { IdService } from '@/core/IdService.js';

export const meta = {
	requireCredential: true,

	secure: true,

	res: {
		type: 'array',
		items: {
			type: 'object',
			properties: {
				id: {
					type: 'string',
					format: 'misskey:id',
				},
				name: {
					type: 'string',
				},
				createdAt: {
					type: 'string',
					format: 'date-time',
				},
				lastUsedAt: {
					type: 'string',
					format: 'date-time',
				},
				permission: {
					type: 'array',
					uniqueItems: true,
					items: {
						type: 'string',
					},
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		sort: { type: 'string', enum: ['+createdAt', '-createdAt', '+lastUsedAt', '-lastUsedAt'] },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.accessTokensRepository)
		private accessTokensRepository: AccessTokensRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.accessTokensRepository.createQueryBuilder('token')
				.where('token.userId = :userId', { userId: me.id })
				.leftJoinAndSelect('token.app', 'app');

			switch (ps.sort) {
				case '+createdAt': query.orderBy('token.id', 'DESC'); break;
				case '-createdAt': query.orderBy('token.id', 'ASC'); break;
				case '+lastUsedAt': query.orderBy('token.lastUsedAt', 'DESC'); break;
				case '-lastUsedAt': query.orderBy('token.lastUsedAt', 'ASC'); break;
				default: query.orderBy('token.id', 'ASC'); break;
			}

			const tokens = await query.getMany();

			return await Promise.all(tokens.map(token => ({
				id: token.id,
				name: token.name ?? token.app?.name,
				createdAt: this.idService.parse(token.id).date.toISOString(),
				lastUsedAt: token.lastUsedAt?.toISOString(),
				permission: token.permission,
			})));
		});
	}
}
