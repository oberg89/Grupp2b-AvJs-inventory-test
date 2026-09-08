export default function GenericResult({ result, columns }) {
  if (Array.isArray(result)) {
    // tom array betyder att det inte finns något resultat att visa
    if (result.length === 0) {
      return <p>Inget resultat att visa.</p>;
    }

    // om inga kolumner skickas in använder vi nycklarna från första raden
    const resultColumns = columns?.length
      ? columns
      : Object.keys(result[0]).map(key => ({ key, label: key }));

    return (
      <table>
        <thead>
          <tr>
            {resultColumns.map(column => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {resultColumns.map(column => (
                <td key={column.key}>
                  {column.render
                    ? column.render(row)
                    : typeof row[column.key] === "boolean"
                      ? String(row[column.key])
                      : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (result !== null && typeof result === "object") {
    return (
      <dl>
        {Object.entries(result).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
    );
  }

  return <span>{result}</span>;
}
