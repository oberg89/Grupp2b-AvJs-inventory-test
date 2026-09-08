import { useRef, useState } from "react";
import GenericForm from "./GenericForm";
import GenericResult from "./GenericResult";

export default function ModuleRunner({ moduleClass: ModuleClass, context = {} }) {
  // samma modulinstans behålls mellan komponentens renderingar
  const moduleInstance = useRef(null);
  if (moduleInstance.current === null) {
    moduleInstance.current = new ModuleClass();
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(undefined);

  // descriptor → formulär → run → resultat
  async function handleSubmit(values) {
    setLoading(true);
    setError(null);

    try {
      const nextResult = await moduleInstance.current.run(values, context);
      setResult(nextResult);
    } catch (runError) {
      setError(runError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <GenericForm
        descriptor={ModuleClass.descriptor}
        onSubmit={handleSubmit}
      />
      {loading && <p>Arbetar...</p>}
      {error && <p>Fel: {error}</p>}
      {result !== undefined && <GenericResult result={result} />}
    </>
  );
}
