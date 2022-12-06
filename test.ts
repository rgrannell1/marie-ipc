
import { assertEquals } from "https://deno.land/std@0.167.0/testing/asserts.ts";
import { MarieIpc } from "./src/iso.ts";
import { Triple } from "./src/types.ts";

Deno.test({
  name: ".maxId() defaults to -1",
  fn() {
    assertEquals((new MarieIpc()).maxId(), -1);
  },
});

Deno.test({
  name: ".parse() returns expected triple content for initial parse",
  fn() {
    const parser = new MarieIpc();

    parser.parse('0 "a"', true);
    parser.parse('1 "b"', true);
    parser.parse('2 "c"', true);
    let triple = parser.parse("src 0 rel 1 tgt 0", true);

    assertEquals(parser.state.maxId, 2);
    assertEquals(parser.state.line, 3);

    const iso = parser.state.iso;

    assertEquals(iso.getRight(0), "a");
    assertEquals(iso.getRight(1), "b");
    assertEquals(iso.getRight(2), "c");

    assertEquals(iso.getLeft("a"), 0);
    assertEquals(iso.getLeft("b"), 1);
    assertEquals(iso.getLeft("c"), 2);

    assertEquals(parser.state.triple, {
      src: 0,
      rel: 1,
      tgt: 0,
    });

    assertEquals(triple, {
      src: "a",
      rel: "b",
      tgt: "a",
    });
  },
});


Deno.test({
  name: 'Test entity to triple conversion',
  fn() {
    const entity = {
      id: "Sandqvist",
      is: [ "Bag Store" ],
      location: [ [ 51.5143712119983, "Latitude" ], [ -0.13574656853131364, "Longitude" ] ],
      patterns: [ "VDP-Sandqvist" ]
    }

    const serialiser = new MarieIpc();
    const serialised = serialiser.entityTo(entity);

    const triples: (Triple<string> | Triple<number>)[] = [];

    const parser = new MarieIpc();
    for (const line of serialised.split('\n')) {
      for (const triple of parser.tripleFrom(line, true)) {
        triples.push(triple);
      }
    }

    assertEquals(triples, [
      {
        src: "Sandqvist",
        rel: "id",
        tgt: "Sandqvist",
      },
      {
        src: "Sandqvist",
        rel: "is",
        tgt: "Bag Store",
      },
      {
        src: "Sandqvist",
        rel: "location",
        tgt: "51.5143712119983",
      },
      {
        src: "51.5143712119983",
        rel: "is",
        tgt: "Latitude",
      },
      {
        src: "Sandqvist",
        rel: "location",
        tgt: "-0.13574656853131364",
      },
      {
        src: "-0.13574656853131364",
        rel: "is",
        tgt: "Longitude",
      },
      {
        src: "Sandqvist",
        rel: "patterns",
        tgt: "VDP-Sandqvist",
      }
    ]
    )
  }
})

