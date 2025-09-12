// UI openen
figma.showUI(__html__, { width: 600, height: 450 });

// Mapping: bloknaam -> componentKey
const mapping = {
  "Hero":     "2449dedf70df67b9d393e89e59f0a3c72e4115ea",
  "Grid":     "18ab99bd1d0e9c02a53d23fa60d5502e84c9a840",
  "Kolommen": "d91236c18c35f73c5ccf355fe1dd08f07438de95",
  "Media":    "4309d59db19c74579c75fd1860b42b31cbb93a4f"
};

// Helper: frame voor Auto Layout
function getOrCreateStackFrame() {
  const name = "[WF] Stack";
  let frame = figma.currentPage.findOne(
    n => n.type === "FRAME" && n.name === name
  );
  if (!frame) {
    frame = figma.createFrame();
    frame.name = name;
    frame.x = 0;
    frame.y = 0;
    frame.layoutMode = "VERTICAL";
    frame.primaryAxisSizingMode = "AUTO";
    frame.counterAxisSizingMode = "AUTO";
    frame.itemSpacing = 0;
    frame.paddingTop = frame.paddingRight = frame.paddingBottom = frame.paddingLeft = 0;
    frame.counterAxisAlignItems = "MIN";
    frame.fills = [];
    figma.currentPage.appendChild(frame);
  }
  return frame;
}

// Messages uit de UI
figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate") {
    try {
      const cleaned = msg.json.trim().replace(/\u00A0/g, " ").replace(/\r\n/g, "\n");
      const data = JSON.parse(cleaned);

      const blocks = Array.isArray(data) ? data : [data];
      const stack = getOrCreateStackFrame();

      let placed = 0;
      for (const block of blocks) {
        const name = (block && typeof block === "object") ? block.component : null;
        if (!name) continue;
        const key = mapping[name];
        if (!key) {
          figma.notify(`Onbekend blok: ${name}`);
          continue;
        }

        try {
          const comp = await figma.importComponentByKeyAsync(key);
          const instance = comp.createInstance();
          instance.name = `[WF] ${name}`;
          instance.layoutAlign = "STRETCH";
          stack.appendChild(instance);

          // === DEBUG: log alle beschikbare property keys ===
          console.log(`🔑 Properties voor ${name}:`, instance.componentProperties);

          // === Properties van het blok zelf ===
          if (block.props && typeof block.props === "object") {
            try {
              instance.setProperties(block.props);
              console.log("✅ Props gezet op", name, block.props);
            } catch (e) {
              console.warn("⚠️ Kon properties niet instellen voor", name, e);
            }
          }

          // === Properties van nested children ===
          if (block.children && typeof block.children === "object") {
            for (const childName in block.children) {
              const child = instance.findOne(n => n.type === "INSTANCE" && n.name === childName);
              if (child) {
                console.log(`🔑 Properties voor child ${childName}:`, child.componentProperties);
                try {
                  child.setProperties(block.children[childName]);
                  console.log(`✅ Props gezet op child ${childName}:`, block.children[childName]);
                } catch (e) {
                  console.warn(`⚠️ Kon properties niet instellen voor child ${childName}`, e);
                }
              } else {
                console.warn(`⚠️ Child niet gevonden: ${childName}`);
              }
            }
          }

          placed++;
        } catch (e) {
          console.error(`Kon component niet importeren: ${name}`, e);
        }
      }

      if (placed > 0) {
        figma.notify(`✅ ${placed} blok(ken) toegevoegd.`);
      } else {
        figma.notify("Geen blokken geplaatst.");
      }
    } catch (err) {
      console.error(err);
      figma.notify("JSON niet geldig.");
    }
  }

  if (msg.type === "clear-page") {
    const stack = getOrCreateStackFrame();
    stack.remove();
    figma.notify("Alle blokken verwijderd.");
  }
};
