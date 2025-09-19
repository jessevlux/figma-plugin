// ============== mapping ==============
var mapping = {
  EntryPostSlider: "f6e67fbecfc8796ca7ec65ddaa9f6cc81cea0b7d",
  Grid: "3a59b3a1b88c31b18a7518a28fd1bdbfe4578c5e",
  Hero: "b32b45808374ab06b22672b9b96483c7a1c550db",
  Kolommen: "81fffb24adf546b6231c236876822b4f832465ca",
  MediaGroot: "7f0894e5f2637427637add56872aa7fdd599c243",
  MediaSlider: "ae3a3d3df675839c6193581bec299f5521710df9",
};

figma.showUI(__html__, { width: 600, height: 500 });

// ============== helpers ==============
// Bouwt een map waarmee we óók op leesbare namen kunnen zetten (id vóór '#')
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

// Zet properties op precies die instance (top-level of nested)
function setPropsOnInstance(instance, props, compPath) {
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
          '⚠️ Geen match voor prop "' + key + '" in "' + compPath + '"'
        );
    }
  }
  if (Object.keys(toSet).length) {
    // console.log("✅ Props die gezet worden op", compPath, toSet);
    instance.setProperties(toSet);
    return Object.keys(toSet).length;
  }
  return 0;
}

// Controleer of een gevonden instance een bepaald component (set) is
function isTargetInstance(inst, targetName) {
  if (!inst || inst.type !== "INSTANCE") return false;
  var mc = inst.mainComponent;
  if (!mc) return false;
  // 1) exacte componentnaam (soms is dit de varianten-naam)
  if (mc.name === targetName) return true;
  // 2) naam van het component set (parent)
  var p = mc.parent;
  if (p && p.type === "COMPONENT_SET" && p.name === targetName) return true;
  return false;
}

// Vind alle geneste instances met deze (set)naam
function findNestedInstances(rootInstance, targetName) {
  var all = rootInstance.findAll(function (n) {
    return n.type === "INSTANCE";
  });
  var out = [];
  for (var i = 0; i < all.length; i++) {
    if (isTargetInstance(all[i], targetName)) out.push(all[i]);
  }
  return out;
}

// Past spec toe op een instance en recursief op children-specs
function applySpecToInstance(instance, spec, pathLabel) {
  if (spec.props) setPropsOnInstance(instance, spec.props, pathLabel);

  if (spec.children && spec.children.length) {
    for (var ci = 0; ci < spec.children.length; ci++) {
      var ch = spec.children[ci];
      var matches = findNestedInstances(instance, ch.component || "");
      if (!matches.length) {
        console.warn('⚠️ Geen "' + ch.component + '" gevonden in ' + pathLabel);
        continue;
      }

      // index: nummer -> precies die; "*" of "all" -> allemaal; anders -> eerste
      if (typeof ch.index === "number") {
        var target = matches[ch.index];
        if (target)
          applySpecToInstance(
            target,
            ch,
            pathLabel + " → " + ch.component + "[" + ch.index + "]"
          );
        else
          console.warn(
            "⚠️ Index " +
              ch.index +
              ' buiten bereik voor "' +
              ch.component +
              '" in ' +
              pathLabel
          );
      } else if (ch.index === "*" || ch.index === "all") {
        for (var mi = 0; mi < matches.length; mi++) {
          applySpecToInstance(
            matches[mi],
            ch,
            pathLabel + " → " + ch.component + "[" + mi + "]"
          );
        }
      } else {
        applySpecToInstance(
          matches[0],
          ch,
          pathLabel + " → " + ch.component + "[0]"
        );
      }
    }
  }
}

// Maak/haal Wireframe-root (witte achtergrond, auto layout verticaal)
function getOrCreateWireframeRoot() {
  var children = figma.currentPage.children;
  for (var i = 0; i < children.length; i++) {
    var n = children[i];
    if (n.type === "FRAME" && n.name === "Wireframe") {
      n.layoutMode = "VERTICAL";
      n.primaryAxisSizingMode = "AUTO";
      n.counterAxisSizingMode = "AUTO";
      n.itemSpacing = 0;
      n.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // wit
      return n;
    }
  }
  var f = figma.createFrame();
  f.name = "Wireframe";
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = 0;
  f.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }]; // wit
  figma.currentPage.appendChild(f);
  return f;
}

// ============== main ==============
figma.ui.onmessage = async function (msg) {
  if (msg.type === "generate-wireframe") {
    var originalCenter = figma.viewport.center;
    var originalZoom = figma.viewport.zoom;

    try {
      var blocks = JSON.parse(msg.json);
      var wireframeRoot = null;
      var invalid = [];
      var created = 0;

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
          invalid.push(compName || "[ontbreekt]");
          continue;
        }

        try {
          var comp = await figma.importComponentByKeyAsync(key);
          var instance = comp.createInstance();

          // Top-level props
          applySpecToInstance(
            instance,
            {
              props: block.props || {},
              children: block.children || [],
              component: compName,
            },
            compName
          );

          // Wireframe pas nu maken
          if (!wireframeRoot) wireframeRoot = getOrCreateWireframeRoot();
          wireframeRoot.appendChild(instance);
          created++;
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
          invalid.push(compName);
        }
      }

      // niets aangemaakt? laat ook geen lege wireframe achter
      if (
        created === 0 &&
        wireframeRoot &&
        wireframeRoot.children.length === 0
      ) {
        wireframeRoot.remove();
      }

      // viewport terugzetten
      figma.viewport.center = originalCenter;
      figma.viewport.zoom = originalZoom;

      if (invalid.length) {
        var preview = invalid.slice(0, 3).join(", ");
        var suffix =
          invalid.length > 3 ? ", +" + (invalid.length - 3) + " meer" : "";
        figma.notify("Onbekende component(en): " + preview + suffix, {
          error: true,
        });
      } else if (created === 0) {
        figma.notify("Er is niets geplaatst (geen geldige componenten).");
      } else {
        figma.notify("Wireframe bijgewerkt met " + created + " blok(ken).");
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
