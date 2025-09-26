// ============== mapping ==============
var mapping = {
  CalltoAction: "8a16e7ae870332d3ee5dee0b0a7bbe36161b78e4", // Call to Action
  EntryPostSlider: "f6e67fbecfc8796ca7ec65ddaa9f6cc81cea0b7d", // Entry/Post Slider
  Footer: "a86d31be91c7e1072a2c3b7ea9f3420087fae45c", // Footer
  Grid: "3a59b3a1b88c31b18a7518a28fd1bdbfe4578c5e", // Grid
  Hero: "b32b45808374ab06b22672b9b96483c7a1c550db", // Hero
  Kolommen: "81fffb24adf546b6231c236876822b4f832465ca", // Kolommen
  LogoSlider: "0d566f76593314a890563894e9a518e7802c1501", // Logo Slider
  MediaGroot: "7f0894e5f2637427637add56872aa7fdd599c243", // Media Groot
  MediaSlider: "ae3a3d3df675839c6193581bec299f5521710df9", // Media Slider
};

figma.showUI(__html__, { width: 600, height: 500 });

// ============== helpers ==============
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
    instance.setProperties(toSet);
    return Object.keys(toSet).length;
  }
  return 0;
}

function isTargetInstance(inst, targetName) {
  if (!inst || inst.type !== "INSTANCE") return false;
  var mc = inst.mainComponent;
  if (!mc) return false;
  if (mc.name === targetName) return true;
  var p = mc.parent;
  if (p && p.type === "COMPONENT_SET" && p.name === targetName) return true;
  return false;
}

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

// maakt frame voor 1 pagina (wit, auto-layout) met horizontale offset
function createPageFrame(pageName, index) {
  var f = figma.createFrame();
  f.name = "Wireframe – " + pageName;
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = 0;
  f.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];

  // Zet elke pagina naast elkaar
  f.x = index * 1600; // horizontale offset per pagina
  f.y = 0;

  // Zorg dat Figma dit frame niet probeert te alignen in iets anders
  f.layoutAlign = "INHERIT";

  figma.currentPage.appendChild(f);
  return f;
}

// ============== main ==============
figma.ui.onmessage = async function (msg) {
  if (msg.type === "generate-wireframe") {
    var originalCenter = figma.viewport.center;
    var originalZoom = figma.viewport.zoom;

    try {
      var parsed = JSON.parse(msg.json);
      var invalid = [];
      var created = 0;

      var pages =
        Array.isArray(parsed) && parsed[0] && parsed[0].page
          ? parsed
          : [{ page: "Default", blocks: parsed }];

      for (var pi = 0; pi < pages.length; pi++) {
        var pageSpec = pages[pi];
        var pageFrame = createPageFrame(pageSpec.page || "Page", pi);

        for (var bi = 0; bi < pageSpec.blocks.length; bi++) {
          var block = pageSpec.blocks[bi];
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

            applySpecToInstance(
              instance,
              {
                props: block.props || {},
                children: block.children || [],
                component: compName,
              },
              compName
            );

            pageFrame.appendChild(instance);
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

        if (pageFrame.children.length === 0) pageFrame.remove();
      }

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
        figma.notify(
          "Wireframes bijgewerkt met " +
            created +
            " blok(ken) in " +
            pages.length +
            " pagina('s)."
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
      if (n.type === "FRAME" && n.name.startsWith("Wireframe")) {
        n.remove();
        removed = true;
      }
    }
    figma.notify(
      removed ? "Wireframes leeggemaakt" : "Geen Wireframes gevonden"
    );
  }
};
