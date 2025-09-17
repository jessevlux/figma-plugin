// Mapping van bloknamen naar componentKeys
const mapping = {
  EntryPostSlider: "f6e67fbecfc8796ca7ec65ddaa9f6cc81cea0b7d", // Entry/Post Slider
  Grid: "3a59b3a1b88c31b18a7518a28fd1bdbfe4578c5e", // Grid
  Hero: "b32b45808374ab06b22672b9b96483c7a1c550db", // Hero
  Kolommen: "81fffb24adf546b6231c236876822b4f832465ca", // Kolommen
  MediaGroot: "7f0894e5f2637427637add56872aa7fdd599c243", // Media Groot
  MediaSlider: "ae3a3d3df675839c6193581bec299f5521710df9", // Media Slider
};

figma.showUI(__html__, { width: 600, height: 500 });

// ---------- helpers ----------
function buildNameToIdFromInstance(instance) {
  var map = {};
  var instProps = instance.componentProperties || {};
  for (var id in instProps) {
    map[id] = id;
    var base = id.indexOf("#") >= 0 ? id.split("#")[0] : id;
    map[base] = id;
  }
  return map;
}

function setPropsByName(instance, props, compName) {
  if (!props) return 0;
  var nameToId = buildNameToIdFromInstance(instance);
  var toSet = {};
  for (var key in props) {
    if (nameToId[key]) {
      toSet[nameToId[key]] = props[key];
    } else {
      var t = key.trim();
      if (nameToId[t]) toSet[nameToId[t]] = props[key];
      else
        console.warn(
          '⚠️ Geen match voor prop "' + key + '" in "' + compName + '"'
        );
    }
  }
  if (Object.keys(toSet).length > 0) {
    console.log("✅ Props die gezet worden:", toSet);
    instance.setProperties(toSet);
    return Object.keys(toSet).length;
  }
  return 0;
}

// recursief door children
function applyChildPropsRecursive(instance, children, compName, prefix = "") {
  if (!children || !children.length) return;
  for (var ci = 0; ci < children.length; ci++) {
    var child = children[ci];
    if (child && child.props) {
      // direct proberen
      setPropsByName(instance, child.props, compName);
      // prefixed proberen
      var prefixed = {};
      for (var ck in child.props) {
        prefixed[prefix + child.component + "." + ck] = child.props[ck];
      }
      setPropsByName(instance, prefixed, compName);
      // recursief door child.children
      if (child.children) {
        applyChildPropsRecursive(
          instance,
          child.children,
          compName,
          prefix + child.component + "."
        );
      }
    }
  }
}

// maakt/zoekt Wireframe frame
function getOrCreateWireframeRoot() {
  var children = figma.currentPage.children;
  for (var i = 0; i < children.length; i++) {
    var n = children[i];
    if (n.type === "FRAME" && n.name === "Wireframe") {
      n.layoutMode = "VERTICAL";
      n.primaryAxisSizingMode = "AUTO";
      n.counterAxisSizingMode = "AUTO";
      n.itemSpacing = 16;
      n.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // witte achtergrond
      return n;
    }
  }
  var f = figma.createFrame();
  f.name = "Wireframe";
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = 16;
  f.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // wit
  figma.currentPage.appendChild(f);
  return f;
}

// ---------- main ----------
figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-wireframe") {
    var originalCenter = figma.viewport.center;
    var originalZoom = figma.viewport.zoom;

    try {
      var blocks = JSON.parse(msg.json);

      var wireframeRoot = null;
      var invalidComponents = [];
      var createdCount = 0;

      for (var bi = 0; bi < blocks.length; bi++) {
        var block = blocks[bi];
        var compName = block.component;
        var key = mapping[compName];

        console.log(
          'DEBUG → JSON component: "' +
            compName +
            '", mapping key: ' +
            (key || "NIET GEVONDEN")
        );

        if (!key) {
          invalidComponents.push(compName || "[ontbreekt]");
          continue;
        }

        try {
          var comp = await figma.importComponentByKeyAsync(key);
          var instance = comp.createInstance();

          var instProps = instance.componentProperties || {};
          console.log('🔎 Instance props voor "' + compName + '":');
          for (var pid in instProps) {
            console.log("  • ID: " + pid + ", type: " + instProps[pid].type);
          }

          // props op parent
          setPropsByName(instance, block.props || {}, compName);

          // props uit children recursief toepassen
          if (block.children && block.children.length) {
            applyChildPropsRecursive(instance, block.children, compName);
          }

          if (!wireframeRoot) wireframeRoot = getOrCreateWireframeRoot();
          wireframeRoot.appendChild(instance);
          createdCount++;

          console.log(
            '✅ Component "' + compName + '" succesvol geïmporteerd.'
          );
        } catch (err) {
          console.error(
            '❌ Figma kon component "' +
              compName +
              '" met key "' +
              key +
              '" NIET laden.',
            err
          );
          invalidComponents.push(compName);
        }
      }

      if (
        createdCount === 0 &&
        wireframeRoot &&
        wireframeRoot.children.length === 0
      ) {
        wireframeRoot.remove();
      }

      figma.viewport.center = originalCenter;
      figma.viewport.zoom = originalZoom;

      if (invalidComponents.length > 0) {
        var preview = invalidComponents.slice(0, 3).join(", ");
        var suffix =
          invalidComponents.length > 3
            ? ", +" + (invalidComponents.length - 3) + " meer"
            : "";
        figma.notify("Onbekende component(en): " + preview + suffix, {
          error: true,
        });
      } else if (createdCount === 0) {
        figma.notify(
          "Er is niets geplaatst (geen geldige componenten gevonden)."
        );
      } else {
        figma.notify(
          "Wireframe bijgewerkt met " + createdCount + " blok(ken)."
        );
      }
    } catch (e) {
      console.error("JSON fout:", e);
      figma.notify("JSON niet geldig: " + e.message, { error: true });
    }
  }

  if (msg.type === "clear-page") {
    var pageChildren = figma.currentPage.children;
    var removed = false;
    for (var i = pageChildren.length - 1; i >= 0; i--) {
      var n = pageChildren[i];
      if (n.type === "FRAME" && n.name === "Wireframe") {
        n.remove();
        removed = true;
      }
    }
    figma.notify(removed ? "Wireframe leeggemaakt" : "Geen Wireframe gevonden");
  }
};
