export class MetaApplaTouchIcon1699539593377 {
	name = 'MetaApplaTouchIcon1699539593377'

	async up(queryRunner) {
		queryRunner.query(`ALTER TABLE "meta" ADD "appleIconUrl" varchar(1024)`);
	}

	async down(queryRunner) {
		queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "appleIconUrl"`);
	}
}
