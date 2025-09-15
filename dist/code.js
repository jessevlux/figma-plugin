// Mapping van bloknamen naar componentKeys
const mapping = {
  Hero: "efeb972be21d10bf3c44bece38dd603531e10d5f",
  Grid: "18ab99bd1d0e9c02a53d23fa60d5502e84c9a840",
  Kolommen: "d91236c18c35f73c5ccf355fe1dd08f07438de95",
  Media: "4309d59db19c74579c75fd1860b42b31cbb93a4f"
};

figma.showUI(__html__, { width: 600, height: 500 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-wireframe") {
    try {
      const blocks = JSON.parse(msg.json);

      // Maak container frame met auto-layout
      const container = figma.createFrame();
      container.layoutMode = "VERTICAL";
      container.primaryAxisSizingMode = "AUTO";
      container.counterAxisSizingMode = "AUTO";
      container.itemSpacing = 16;
      container.name = "Wireframe";

  for (const block of blocks) {
    const key = mapping[block.component];
    if (!key) {
      console.warn(`Geen key gevonden voor component: ${block.component}`);
      continue;
    }

    const comp = await figma.importComponentByKeyAsync(key);
    const instance = comp.createInstance();

    // Props proberen te zetten (naam->ID mapping ondersteunen)
    if (block.props) {
      try {
        const defs = (comp && comp.componentPropertyDefinitions) || {};
        // mapping: zichtbare naam -> propertyId en set van geldige IDs
        const nameToId = {};
        const validIds = new Set();
        for (const [propId, def] of Object.entries(defs)) {
          validIds.add(propId);
          if (def && def.name) nameToId[def.name] = propId;
        }

        // Alleen bekende properties meesturen
        const propsById = {};
        for (const [k, v] of Object.entries(block.props)) {
          if (nameToId[k]) {
            propsById[nameToId[k]] = v;
          } else if (validIds.has(k)) {
            propsById[k] = v; // reeds een ID
          } // onbekend -> negeren
        }

        if (Object.keys(propsById).length > 0) {
          instance.setProperties(propsById);
        } else {
          // Heuristiek: geen defs gematcht. Probeer via instance.componentProperties.
          const instProps = instance.componentProperties || {};
          const textPropIds = Object.entries(instProps)
            .filter(([, info]) => info && info.type === "TEXT")
            .map(([id]) => id);

          // Als er precies 1 TEXT property is en we hebben een titelwaarde, zet die.
          var titleValue = (block.props["Hero Title"] != null)
            ? block.props["Hero Title"]
            : ((block.props["Title"] != null)
                ? block.props["Title"]
                : block.props["title"]);

          if (textPropIds.length === 1 && typeof titleValue === "string") {
            instance.setProperties({ [textPropIds[0]]: titleValue });
            console.warn(
              "Geen defs via namen; heb 1 TEXT property gevonden en die gevuld met titel."
            );
          } else {
            const available = Object.values(defs)
              .map(function(d) { return d && d.name ? d.name : null; })
              .filter(Boolean)
              .join(", ");
            console.warn(
              `Geen overeenkomende properties gevonden. Beschikbaar: ${available}`
            );
          }
        }
      } catch (err) {
        console.warn("Kon properties niet zetten:", err);
      }
    }

        container.appendChild(instance);
      }

      figma.currentPage.appendChild(container);
      figma.viewport.scrollAndZoomIntoView([container]);
      figma.notify("Wireframe gegenereerd!");
    } catch (e) {
      console.error("JSON fout:", e);
      figma.notify("JSON niet geldig: " + e.message);
    }
  }

  if (msg.type === "clear-page") {
    figma.currentPage.selection = [];
    figma.currentPage.children.forEach(node => node.remove());
    figma.notify("Alle blokken verwijderd");
  }
};
