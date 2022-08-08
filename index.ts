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

const marieOut = new MarieIpc();
const marieIn = new MarieIpc();

for (const entity of sample3) {
  const x = marieOut.entityTo(entity);

  for (const parsed of marieIn.tripleFrom(x, true)) {
    console.log(parsed);
  }
}
