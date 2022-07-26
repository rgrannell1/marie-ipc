import { Triple } from "./src/types.ts";
import { MarieIpc } from "./src/iso.ts";

const sample2: Triple[] = [
  { src: "me", rel: "is", tgt: "ok" },
  { src: "me", rel: "is", tgt: "bad" },
  { src: "me", rel: "likes", tgt: "bad" },
];

const sample = `
0 "me"
1 "is"
2 "ok"
src 0 rel 1 tgt 2
3 "bad"
src 0 rel 1 tgt 3
4 "likes"
src 0 rel 4 tgt 3
`;

const marie = new MarieIpc();

for (const triple of sample2) {
  const x = marie.tripleTo(triple);
  console.log(x);
}
