/*
  FIX: Keep existing Level.num values by renaming column instead of dropping it.
*/

-- DropForeignKey (existing FK)
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_levelNum_fkey";

-- Make sure PK is dropped before renaming (safe even if already absent)
ALTER TABLE "Level" DROP CONSTRAINT IF EXISTS "Level_pkey";

-- Rename column num -> levelNum (keeps data)
ALTER TABLE "Level" RENAME COLUMN "num" TO "levelNum";

-- Ensure NOT NULL (your warning said 3 non-null values, so this should be safe)
ALTER TABLE "Level" ALTER COLUMN "levelNum" SET NOT NULL;

-- Recreate PK on levelNum
ALTER TABLE "Level" ADD CONSTRAINT "Level_pkey" PRIMARY KEY ("levelNum");

-- Recreate FK from User.levelNum -> Level.levelNum
ALTER TABLE "User"
  ADD CONSTRAINT "User_levelNum_fkey"
  FOREIGN KEY ("levelNum") REFERENCES "Level"("levelNum")
  ON DELETE RESTRICT ON UPDATE CASCADE;
