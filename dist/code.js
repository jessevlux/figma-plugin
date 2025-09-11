async function run() {
  const mapping = {
    Hero: "2449dedf70df67b9d393e89e59f0a3c72e4115ea",
    Grid: "18ab99bd1d0e9c02a53d23fa60d5502e84c9a840",
    Kolommen: "d91236c18c35f73c5ccf355fe1dd08f07438de95",
    Media: "4309d59db19c74579c75fd1860b42b31cbb93a4f"
  };

  let y = 0;
  for (const name of ["Hero", "Kolommen", "Grid", "Media"]) {
    const key = mapping[name];
    const comp = await figma.importComponentByKeyAsync(key);
    const inst = comp.createInstance();
    inst.x = 0;
    inst.y = y;
    figma.currentPage.appendChild(inst);
    y += inst.height + 50;
  }
  figma.closePlugin("Klaar!");
}

run();
