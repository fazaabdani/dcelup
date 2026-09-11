import { PrismaClient } from "@prisma/client";
import { GROUPS, MENU } from "../lib/menu";

const prisma = new PrismaClient();

function groupIdFor(menuId: string): string {
  return GROUPS.find((group) => group.itemIds.includes(menuId))?.id || "";
}

async function main() {
  for (let index = 0; index < MENU.length; index++) {
    const item = MENU[index];
    await prisma.menuItem.upsert({
      where: { id: item.id },
      create: {
        id: item.id,
        groupId: groupIdFor(item.id),
        name: item.name,
        variant: item.variant,
        price: item.price,
        cost: item.cost,
        sortOrder: index,
      },
      // Sengaja tidak menimpa `cost` kalau baris sudah ada - itu kolom yang
      // diubah admin lewat aplikasi, seed cuma untuk mengisi data awal.
      update: {},
    });
  }
  console.log(`Seed selesai: ${MENU.length} menu item dipastikan ada.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
