export class DeleteEvent1697810306869 {
	name = 'DeleteEvent1697810306869'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "hasEvent"`);
		await queryRunner.query(`DROP TABLE "event"`);
	}

	async down(queryRunner) {
	}

}
