import "react-app-polyfill/ie11";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SuspensionRig, useSuspension } from "../.";
import { useState } from "react";

const PokeInfo = ({ pokemonNumber }: { pokemonNumber: number }) => {
  console.log("Going to load ", pokemonNumber);

  const pokemon = useSuspension(
    async (missingNo: number): Promise<any> => {
      console.log("Doing actual fetch with ", missingNo);
      const fetched = await fetch(`https://pokeapi.co/api/v2/pokemon/${missingNo}`);
      return (await fetched.json()) as any;
    },
    `load-pokemon`,
    [pokemonNumber]
  );

  return (
    <div key={`pokemon-${pokemonNumber}`}>
      <h3>Pokemon number {pokemonNumber}</h3>
      <h1>{pokemon.species.name}</h1>
      <div>
        <img src={pokemon.sprites.front_default} alt={`Picture of number ${pokemonNumber}`} />
      </div>
      <div>
        <a href={pokemon.species.url} target="_blank" rel="noreferrer noopener">
          More about {pokemon.species.name} &rarr;
        </a>
      </div>
    </div>
  );
};

const PokeForm = ({
  initialPokeNumber,
  onDoLoad
}: {
  initialPokeNumber?: number;
  onDoLoad: (no: number) => void;
}) => {
  const [pokeNumber, setPokeNumber] = React.useState<number>(initialPokeNumber ?? 25);

  return (
    <div>
      Load a pokemon:{" "}
      <input
        type="number"
        onChange={(e) => {
          const newNumb = Number(e.target.value);
          if (isNaN(newNumb)) {
            e.preventDefault();
            return;
          }
          setPokeNumber(Number(e.target.value));
        }}
        value={pokeNumber}
      />
      <button
        type="button"
        onClick={() => {
          onDoLoad(pokeNumber);
        }}
      >
        I choose you!
      </button>
    </div>
  );
};

const PokeError = ({ error, resetErrorBoundary }) => {
  console.error(error);
  return (
    <>
      <div>Uh oh! A poke-error occurred!</div>
      <PokeForm
        onDoLoad={(n) => {
          resetErrorBoundary(n);
        }}
      />
    </>
  );
};

const App = () => {
  const [renderedPokeNumber, setRenderedPokeNumber] = useState<number>(25);

  console.log(renderedPokeNumber);
  return (
    <main>
      <SuspensionRig
        fallback={<div>Pokeloading...</div>}
        errorBoundary={{
          onReset: (newNumber: number) => {
            const newNo = Number(newNumber);
            if (!isNaN(newNo)) {
              setRenderedPokeNumber(newNo);
            }
          },
          FallbackComponent: PokeError,
          resetKeys: [renderedPokeNumber]
        }}
      >
        <PokeInfo pokemonNumber={renderedPokeNumber} />
        <br />
        <PokeForm
          onDoLoad={(n) => setRenderedPokeNumber(n)}
          initialPokeNumber={renderedPokeNumber}
        />
      </SuspensionRig>
    </main>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
