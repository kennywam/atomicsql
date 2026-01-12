import { startRepl } from "./repl/repl";

startRepl((input: string) => {
  console.log("You typed:", input);
});
