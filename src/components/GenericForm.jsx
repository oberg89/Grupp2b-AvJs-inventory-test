
// Den här filen bygger formulär från en modul-descriptor.
// Samma komponent kan därför användas av alla moduler.

import { useState } from "react";

function validateField(field, value) {
  if (field.required && (value === "" || value === undefined || value === null)) {
    return `${field.label} är obligatoriskt`;
  }

  if (field.type === "number" && value !== "" && !Number.isFinite(Number(value))) {
    return `${field.label} måste vara ett nummer`;
  }

  if (field.type === "number" && value !== "" && field.min !== undefined && Number(value) < field.min) {
    return `${field.label} måste vara minst ${field.min}`;
  }

  if (field.type === "number" && value !== "" && field.max !== undefined && Number(value) > field.max) {
    return `${field.label} får vara högst ${field.max}`;
  }

  if (field.maxLength !== undefined && String(value).length > field.maxLength) {
    return `${field.label} får vara max ${field.maxLength} tecken`;
  }

  return null;
}

export default function GenericForm({ descriptor, onSubmit }) {
  // hämtar fälten som hör till modulens run-metod
  const runDefinition = descriptor.methodsAndInputs.find(
    definition => definition.method === "run"
  );
  const fields = runDefinition?.input ?? [];

  // bygger startvärden från descriptorn
  const initialValues = Object.fromEntries(
    fields.map(field => [field.name, field.initialValue ?? ""])
  );
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});

  // samma change-handler används för alla inputs
  function handleChange(name, value) {
    setValues(previousValues => ({ ...previousValues, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const newErrors = {};

    // kollar fälten mot reglerna i descriptorn
    fields.forEach(field => {
      const error = validateField(field, values[field.name]);
      if (error) newErrors[field.name] = error;
    });

    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      onSubmit(values);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h3>{descriptor.name}</h3>
      {fields.map(field => (
        <div key={field.name}>
          <label htmlFor={field.name}>{field.label}</label>
          {field.type === "select" ? (
            <select
              id={field.name}
              value={values[field.name]}
              onChange={event => handleChange(field.name, event.target.value)}
            >
              <option value="">Välj...</option>
              {(field.options ?? []).map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          ) : (
            <input
              id={field.name}
              type={field.type}
              value={values[field.name]}
              onChange={event => handleChange(field.name, event.target.value)}
            />
          )}
          {errors[field.name] && (
            <p style={{ color: "red" }}>{errors[field.name]}</p>
          )}
        </div>
      ))}
      <button type="submit">Skicka</button>
    </form>
  );
}
