/*
 * SPDX-FileCopyrightText: syuilo and other misskey, cherrypick contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'cherrypick-js';
import { markRaw } from 'vue';
import { $i } from '@/account.js';
import { url } from '@/config.js';

let stream: Misskey.Stream | null = null;
let timeoutHeadBeat: number | null = null;

export let isReloading = false;

export function useStream(): Misskey.Stream {
	if (stream) return stream;

	stream = markRaw(new Misskey.Stream(url, $i ? {
		token: $i.token,
	} : null));

	timeoutHeadBeat = window.setTimeout(heartbeat, 1000 * 60);

	return stream;
}

export function reloadStream() {
	if (!stream) return useStream();
	if (timeoutHeadBeat) window.clearTimeout(timeoutHeadBeat);
	isReloading = true;

	stream.close();
	stream.once('_connected_', () => isReloading = false);
	stream.stream.reconnect();
	timeoutHeadBeat = window.setTimeout(heartbeat, 1000 * 60);

	return stream;
}

function heartbeat(): void {
	if (stream != null && document.visibilityState === 'visible') {
		stream.heartbeat();
	}
	timeoutHeadBeat = window.setTimeout(heartbeat, 1000 * 60);
}
