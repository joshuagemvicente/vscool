/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import assert from 'assert';
import { VSBuffer } from '../../../../base/common/buffer.js';
import { DisposableStore } from '../../../../base/common/lifecycle.js';
import { Schemas } from '../../../../base/common/network.js';
import { URI } from '../../../../base/common/uri.js';
import { ensureNoDisposablesAreLeakedInTestSuite } from '../../../../base/test/common/utils.js';
import { FileService } from '../../../files/common/fileService.js';
import { InMemoryFileSystemProvider } from '../../../files/common/inMemoryFilesystemProvider.js';
import { NullLogService } from '../../../log/common/log.js';
import { LISA_RULES_FOOTER, LISA_RULES_HEADER, collectLisaRuleFiles, formatLisaRules, readWorkspaceLisaRules } from '../../node/shared/lisaRules.js';

suite('LisaRules', () => {

	const disposables = new DisposableStore();
	const logService = new NullLogService();
	const workspaceFolder = URI.from({ scheme: Schemas.inMemory, path: '/workspace' });
	const rulesFolder = URI.joinPath(workspaceFolder, '.lisa', 'rules');
	let fileService: FileService;

	setup(() => {
		fileService = disposables.add(new FileService(new NullLogService()));
		disposables.add(fileService.registerProvider(Schemas.inMemory, disposables.add(new InMemoryFileSystemProvider())));
	});

	teardown(() => disposables.clear());

	ensureNoDisposablesAreLeakedInTestSuite();

	test('yields nothing when the workspace has no rules directory', async () => {
		assert.deepStrictEqual(await collectLisaRuleFiles(fileService, workspaceFolder, logService), []);
		assert.strictEqual(await readWorkspaceLisaRules(fileService, workspaceFolder, logService), undefined);
	});

	test('collects nested markdown in path order, ignoring other files and empty rules', async () => {
		await fileService.createFolder(rulesFolder);
		await fileService.writeFile(URI.joinPath(rulesFolder, 'b.md'), VSBuffer.fromString('B'));
		await fileService.writeFile(URI.joinPath(rulesFolder, 'a.md'), VSBuffer.fromString('A'));
		await fileService.writeFile(URI.joinPath(rulesFolder, 'notes.txt'), VSBuffer.fromString('ignored'));
		await fileService.writeFile(URI.joinPath(rulesFolder, 'blank.md'), VSBuffer.fromString('  \n'));
		await fileService.createFolder(URI.joinPath(rulesFolder, 'nested'));
		await fileService.writeFile(URI.joinPath(rulesFolder, 'nested', 'c.md'), VSBuffer.fromString('C'));

		const files = await collectLisaRuleFiles(fileService, workspaceFolder, logService);
		assert.deepStrictEqual(files.map(file => file.uri.path), [
			'/workspace/.lisa/rules/a.md',
			'/workspace/.lisa/rules/b.md',
			'/workspace/.lisa/rules/nested/c.md',
		]);
		assert.deepStrictEqual(formatLisaRules(files, workspaceFolder), [
			LISA_RULES_HEADER,
			'',
			'.lisa/rules/a.md\nA',
			'',
			'.lisa/rules/b.md\nB',
			'',
			'.lisa/rules/nested/c.md\nC',
			LISA_RULES_FOOTER,
		].join('\n'));
	});

	test('a session without a working directory yields no rules', async () => {
		assert.deepStrictEqual(await collectLisaRuleFiles(fileService, undefined, logService), []);
		assert.strictEqual(await readWorkspaceLisaRules(fileService, undefined, logService), undefined);
	});
});
