/*
  Warnings:

  - A unique constraint covering the columns `[academic_year,batch,class_name]` on the table `tbl_classes` will be added. If there are existing duplicate values, this will fail.
  - Made the column `academic_year` on table `tbl_classes` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "tbl_classes" ALTER COLUMN "academic_year" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tbl_classes_academic_year_batch_class_name_key" ON "tbl_classes"("academic_year", "batch", "class_name");

-- CreateIndex
CREATE INDEX "tbl_students_id_class_idx" ON "tbl_students"("id_class");
