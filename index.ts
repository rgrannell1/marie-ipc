import { Entity } from "./src/types.ts";
import { MarieIpc } from "./src/iso.ts";

const sample3: Entity[] = [
  {
    id: 'test',
    has: 'property',
    likes: 10,
    owns: [
      'Bob',
      'Goose'
    ]
  }
];

const marie = new MarieIpc();

for (const entity of sample3) {
  const x = marie.entityTo(entity);
  console.log(x);
}
