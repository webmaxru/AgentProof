export async function resolve(specifier, context, nextResolve) {
  if (specifier === "@github/copilot-sdk/extension") {
    return {
      shortCircuit: true,
      url: new URL("./sdk-mock.mjs", import.meta.url).href,
    };
  }
  return nextResolve(specifier, context);
}
