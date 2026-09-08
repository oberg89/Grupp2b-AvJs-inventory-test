// Den här sidan hittar kompatibla moduler och visar deras generiska gränssnitt.

import ModuleRunner from "../components/ModuleRunner";

// hittar alla modul-ingångar automatiskt
const moduleFiles = import.meta.glob("../modules/*/index.js", {
    eager: true
});

const discoveredModules = Object.entries(moduleFiles).flatMap(([path, moduleFile]) => {
    const ModuleClass = moduleFile.default;

    if (typeof ModuleClass !== "function" || !ModuleClass.descriptor) {
        return [];
    }

    try {
        const testInstance = new ModuleClass();
        if (typeof testInstance.run !== "function") {
            return [];
        }

        return [{ key: path, moduleClass: ModuleClass }];
    } catch {
        // ofärdiga moduler hoppas över så att sidan fortfarande fungerar
        return [];
    }
});

export default function Admin() {
    return (
        <>
            <h1>Butiksadmin</h1>
            {discoveredModules.map(({ key, moduleClass }) => (
                <section key={key}>
                    <ModuleRunner moduleClass={moduleClass} />
                </section>
            ))}
            {discoveredModules.length === 0 && (
                <p>Inga kompatibla moduler hittades.</p>
            )}
        </>
    );
}
