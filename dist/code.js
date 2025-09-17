// ==== Mapping van bloknamen naar componentKeys ====
const mapping = {
  EntryPostSlider: "f6e67fbecfc8796ca7ec65ddaa9f6cc81cea0b7d",
  Grid: "3a59b3a1b88c31b18a7518a28fd1bdbfe4578c5e",
  Hero: "b32b45808374ab06b22672b9b96483c7a1c550db",
  Kolommen: "81fffb24adf546b6231c236876822b4f832465ca",
  MediaGroot: "7f0894e5f2637427637add56872aa7fdd599c243",
  MediaSlider: "ae3a3d3df675839c6193581bec299f5521710df9",
};

figma.showUI(__html__, { width: 600, height: 500 });

// ---------- helpers ----------
function getOrCreateWireframeRoot() {
  var children = figma.currentPage.children;
  for (var i = 0; i < children.length; i++) {
    var n = children[i];
    if (n.type === "FRAME" && n.name === "Wireframe") {
      n.layoutMode = "VERTICAL";
      n.primaryAxisSizingMode = "AUTO";
      n.counterAxisSizingMode = "AUTO";
      n.itemSpacing = 16;
      // witte achtergrond
      n.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
      return n;
    }
  }
  var f = figma.createFrame();
  f.name = "Wireframe";
  f.layoutMode = "VERTICAL";
  f.primaryAxisSizingMode = "AUTO";
  f.counterAxisSizingMode = "AUTO";
  f.itemSpacing = 16;
  f.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
  figma.currentPage.appendChild(f);
  return f;
}

function buildNameToIdFromInstance(instance) {
  var map = {};
  var instProps = instance.componentProperties || {};
  for (var id in instProps) {
    // direct op ID zetten
    map[id] = id;
    // fallback: deel vóór '#'
    var base = id.indexOf("#") >= 0 ? id.split("#")[0] : id;
    map[base] = id;
  }
  return map;
}

function setPropsByName(instance, props, labelForLogs) {
  if (!props) return 0;
  var nameToId = buildNameToIdFromInstance(instance);
  var toSet = {};
  for (var key in props) {
    if (nameToId[key]) {
      toSet[nameToId[key]] = props[key];
    } else {
      // laat bewust NIET vallen op "Property 1" als generieke naam als die niet bestaat
      // we willen geen verkeerde parent-variant raken
      var t = key.trim();
      if (nameToId[t]) toSet[nameToId[t]] = props[key];
      else {
        // als er keys bestaan die met "<prefix>." beginnen, dan doet applyChildProps dat,
        // hier loggen we alleen.
        console.warn(
          '⚠️ Geen match voor prop "' + key + '" in "' + labelForLogs + '"'
        );
      }
    }
  }
  if (Object.keys(toSet).length > 0) {
    console.log("✅ Props die gezet worden op [" + labelForLogs + "]:", toSet);
    try {
      instance.setProperties(toSet);
    } catch (e) {
      console.error("❌ setProperties faalde op [" + labelForLogs + "]:", e);
    }
    return Object.keys(toSet).length;
  }
  return 0;
}

// Zoek sub-instances met een bepaalde componentnaam (match op node.name of mainComponent.name)
function findChildInstancesByName(rootInstance, wantedName) {
  var hits = rootInstance.findAll(function (n) {
    if (n.type !== "INSTANCE") return false;
    if (n.name === wantedName) return true;
    var mc = n.mainComponent ? n.mainComponent.name : null;
    return mc === wantedName;
  });
  return hits;
}

// Recursief: pas props toe op target instance en ga door naar zijn children specs
function applySpecToInstance(targetInstance, spec, breadcrumb) {
  var label = breadcrumb + " → " + spec.component;

  // 1) props op dit target zetten (alleen die die bestaan op deze instance)
  setPropsByName(targetInstance, spec.props || {}, label);

  // 2) children specificaties recursief afhandelen
  if (spec.children && spec.children.length) {
    for (var i = 0; i < spec.children.length; i++) {
      var childSpec = spec.children[i];
      var childName = childSpec.component;
      var matches = findChildInstancesByName(targetInstance, childName);

      if (!matches || matches.length === 0) {
        // laatste redmiddel: prefixed props rechtstreeks op dit target proberen
        // (bv. "Media.Property 1": "Variant3")
        if (childSpec.props) {
          var prefixed = {};
          for (var ck in childSpec.props) {
            prefixed[childName + "." + ck] = childSpec.props[ck];
          }
          var setCount = setPropsByName(
            targetInstance,
            prefixed,
            label + " (prefixed fallback)"
          );
          if (setCount === 0) {
            console.warn(
              '⚠️ Subcomponent "' +
                childName +
                '" niet gevonden binnen [' +
                label +
                "]"
            );
          }
        } else {
          console.warn(
            '⚠️ Subcomponent "' +
              childName +
              '" niet gevonden binnen [' +
              label +
              "]"
          );
        }
        continue;
      }

      for (var m = 0; m < matches.length; m++) {
        applySpecToInstance(matches[m], childSpec, label);
      }
    }
  }
}

// ---------- main ----------
figma.ui.onmessage = async (msg) => {
  if (msg.type === "generate-wireframe") {
    var originalCenter = figma.viewport.center;
    var originalZoom = figma.viewport.zoom;

    var wireframeRoot = null;
    var createdCount = 0;
    var invalidComponents = [];

    try {
      var blocks = JSON.parse(msg.json);

      // Maak de Wireframe root aan
      wireframeRoot = getOrCreateWireframeRoot();

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

          wireframeRoot.appendChild(instance);
          createdCount++;

          // logging van overridebare props op de huidige instance
          var instProps = instance.componentProperties || {};
          console.log('🔎 Instance props voor "' + compName + '":');
          for (var pid in instProps) {
            console.log("  • ID:", pid, "type:", instProps[pid].type);
          }

          // props op de parent (bv Kolommen → Property 1: Variant2)
          setPropsByName(instance, block.props || {}, compName);

          // recursief children afhandelen: zoek echte sub-instances en zet daarop de props
          if (block.children && block.children.length) {
            for (var ci = 0; ci < block.children.length; ci++) {
              var childSpec = block.children[ci];
              var matches = findChildInstancesByName(
                instance,
                childSpec.component
              );
              if (!matches || matches.length === 0) {
                // fallback: prefixed proberen op parent (alleen als niets gevonden)
                if (childSpec.props) {
                  var prefixed = {};
                  for (var ck in childSpec.props) {
                    prefixed[childSpec.component + "." + ck] =
                      childSpec.props[ck];
                  }
                  setPropsByName(
                    instance,
                    prefixed,
                    compName + " (prefixed fallback)"
                  );
                } else {
                  console.warn(
                    '⚠️ Subcomponent "' +
                      childSpec.component +
                      '" niet gevonden binnen "' +
                      compName +
                      '"'
                  );
                }
              } else {
                for (var mi = 0; mi < matches.length; mi++) {
                  applySpecToInstance(matches[mi], childSpec, compName);
                }
              }
            }
          }

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

      // Niets geplaatst? Verwijder Wireframe zodat er geen leeg wit vlak achterblijft
      if (
        createdCount === 0 &&
        wireframeRoot &&
        wireframeRoot.children.length === 0
      ) {
        wireframeRoot.remove();
      }

      // Herstel viewport (geen autospring)
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
      // Herstel viewport bij JSON fout ook
      figma.viewport.center = originalCenter;
      figma.viewport.zoom = originalZoom;
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
