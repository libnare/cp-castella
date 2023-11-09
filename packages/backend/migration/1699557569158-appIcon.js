export class AppIcon1699557569158 {
    name = 'AppIcon1699557569158'

    async up(queryRunner) {
        queryRunner.query(`ALTER TABLE "meta" ADD "app769IconUrl" varchar(1024)`);
        queryRunner.query(`ALTER TABLE "meta" ADD "app1024IconUrl" varchar(1024)`);
    }

    async down(queryRunner) {
        queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "app1024IconUrl"`);
        queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "app769IconUrl"`);
    }

}
