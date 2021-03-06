import "react-app-polyfill/ie11";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { SuspensionRig, useSuspension } from "../.";

const PokeInfo = ({ pokemonNumber }: { pokemonNumber: number }) => {
  const pokemon = useSuspension(async (): Promise<any> => {
    const fetched = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonNumber}`);
    return (await fetched.json()) as any;
  }, `load-pokemon-${pokemonNumber}`);

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

const App = () => {
  const [pokeNumber, setPokeNumber] = React.useState<number>(25);
  const [currentPokeNumber, setCurrentPokeNumber] = React.useState<number>(pokeNumber);

  return (
    <main>
      <SuspensionRig
        fallback={<div>Pokeloading...</div>}
        errorFallback={<div>Uh oh! Pokeerror! Try another number.</div>}
      >
        <PokeInfo pokemonNumber={currentPokeNumber} />
      </SuspensionRig>
      <br />
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
        <button type="button" onClick={() => setCurrentPokeNumber(pokeNumber)}>
          I choose you!
        </button>
      </div>
    </main>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
