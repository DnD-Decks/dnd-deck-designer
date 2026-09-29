import { CharacterImportPage } from "src/characters/character-import.page";
import { CharacterPage } from "src/characters/character.page";
import { CharactersPage } from "src/characters/characters.page";
import { CatalogPage, DEFAULT_CATALOG_CLASS } from "src/decks/catalog.page";
import { classes } from "src/models/class/classes.model";
import { Redirect, Route, Switch } from "wouter";

// before routes existed the catalog lived at `#wizard`; old links still land on it
function LegacyClassLink({ cls }: { cls: string }) {
  return <Redirect to={classes.find({ id: cls }) ? `/catalog/${cls}` : "/"} replace />;
}

export function AppRoutes() {
  return (
    <Switch>
      <Route path="/" component={CharactersPage} />
      <Route path="/character/:id">{({ id }) => <CharacterPage id={id} />}</Route>
      <Route path="/import/:code">{({ code }) => <CharacterImportPage code={code} />}</Route>
      <Route path="/catalog">
        <Redirect to={`/catalog/${DEFAULT_CATALOG_CLASS}`} replace />
      </Route>
      <Route path="/catalog/:cls">{({ cls }) => <CatalogPage cls={cls} />}</Route>
      <Route path="/:cls">{({ cls }) => <LegacyClassLink cls={cls} />}</Route>
      <Route>
        <Redirect to="/" replace />
      </Route>
    </Switch>
  );
}
