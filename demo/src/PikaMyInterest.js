import { useSuspension } from "../../lib";

function AllAboutPokemon(props) {
  const { id } = props;

  const pokeInfo = useSuspension(() => {
    return fetch("https://pokeapi.co/api/v2/pokemon/" + id).then((resp) => resp.json);
  });

  return (
    <div>
      <h1>
        {pokeInfo.species.name} - #{id}
      </h1>
      <div>
        <img src={pokeInfo.sprites.front_default} alt="Default sprite" />
      </div>
      <div>
        <a href={pokeInfo.species.url} rel="noreferrer noopener" target="_blank">
          More info about {pokeInfo.species.name} &rarr;
        </a>
      </div>
    </div>
  );
}
