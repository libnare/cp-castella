export class DeleteDisableRightClick1697809019142 {
	name = 'DeleteDisableRightClick1697809019142'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "disableRightClick"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "disableRightClick"`);
	}

}
