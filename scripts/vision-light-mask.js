
/**
 * Drakkenheim 5e
 * Vision Light Mask
 * Foundry VTT v14
 */

const VisionLightMask = {
  MODULE_ID: "drakkenheim-5e",
  FLAG_NAME: "hideUnderFog",

  masks: new WeakMap(),
  ticker: null,

  /**
   * Добавление галочки в настройки Ambient Light.
   */
  addCheckbox(app, html) {
    if (!game.user.isGM) return;

    const root = html instanceof HTMLElement ? html : app.element;
    if (!root) return;

    const locationFieldset = root.querySelector(
      '[data-tab="basic"] fieldset'
    );

    if (!locationFieldset) {
      console.warn("Drakkenheim 5e | Не найден блок «Расположение».");
      return;
    }

    if (locationFieldset.querySelector("#hide-under-fog")) return;

    const lightDocument = app.document;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "hide-under-fog";

    checkbox.checked = lightDocument.getFlag(
      this.MODULE_ID,
      this.FLAG_NAME
    ) ?? false;

    const group = document.createElement("div");
    group.className = "form-group";

    const label = document.createElement("label");
    label.htmlFor = "hide-under-fog";
    label.textContent = "Скрыть под туманом войны";

    const fields = document.createElement("div");
    fields.className = "form-fields";

    fields.appendChild(checkbox);
    group.append(label, fields);
    locationFieldset.appendChild(group);

    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;

      try {
        await lightDocument.setFlag(
          this.MODULE_ID,
          this.FLAG_NAME,
          checkbox.checked
        );
      } catch (error) {
        console.error(
          "Drakkenheim 5e | Ошибка сохранения настройки:",
          error
        );

        checkbox.checked = !checkbox.checked;

        ui.notifications.error(
          "Не удалось сохранить настройку источника света."
        );
      } finally {
        checkbox.disabled = false;
      }
    });
  },

  /**
   * Получаем документ Ambient Light.
   */
  getLightDocument(source) {
    const object = source.object;

    if (object?.document) return object.document;

    const placeable = canvas.lighting.placeables.find(
      light => light.sourceId === source.sourceId
    );

    return placeable?.document ?? null;
  },

  /**
   * Получаем спрайт актуальной маски зрения.
   */
  getVisionMask() {
    return canvas.masks?.vision?.sprite ?? null;
  },

  /**
   * Создаём и применяем маску к слою света.
   */
  applyMask(mesh, visionMask) {
    if (!mesh || !visionMask || !mesh.parent) return;

    let entry = this.masks.get(mesh);

    // Если Foundry переместил меш в другой контейнер,
    // удаляем старую маску и создаём новую.
    if (entry && entry.parent !== mesh.parent) {
      this.removeMask(mesh);
      entry = null;
    }

    if (!entry) {
      const maskSprite = new PIXI.Sprite(visionMask.texture);

      maskSprite.anchor.set(
        visionMask.anchor?.x ?? 0,
        visionMask.anchor?.y ?? 0
      );

      maskSprite.alpha = 1;

      // Маска располагается в том же контейнере,
      // что и ограничиваемый слой.
      mesh.parent.addChild(maskSprite);

      entry = {
        originalMask: mesh.mask ?? null,
        maskSprite,
        appliedMask: null,
        parent: mesh.parent
      };

      this.masks.set(mesh, entry);

      // Используем красный канал LOS-текстуры.
      mesh.setMask({
        mask: maskSprite,
        channel: "red"
      });

      entry.appliedMask = mesh.mask;
    }

    // Обновляем текстуру, если Foundry пересоздал маску зрения.
    if (entry.maskSprite.texture !== visionMask.texture) {
      entry.maskSprite.texture = visionMask.texture;
    }

    // Актуализируем точку привязки.
    entry.maskSprite.anchor.set(
      visionMask.anchor?.x ?? 0,
      visionMask.anchor?.y ?? 0
    );

    // Получаем актуальные глобальные трансформации.
    const parentWorld = mesh.parent.getGlobalTransform();
    const visionWorld = visionMask.getGlobalTransform();

    // Переводим глобальную трансформацию LOS
    // в локальную систему координат родителя меша.
    const localTransform = parentWorld.clone()
      .invert()
      .append(visionWorld);

    entry.maskSprite.setFromMatrix(localTransform);
  },

  /**
   * Убираем нашу маску с меша.
   */
  removeMask(mesh) {
    if (!mesh) return;

    const entry = this.masks.get(mesh);
    if (!entry) return;

    // Восстанавливаем первоначальную маску.
    if (mesh.mask === entry.appliedMask) {
      mesh.setMask({
        mask: entry.originalMask
      });
    }

    if (entry.maskSprite.parent) {
      entry.maskSprite.parent.removeChild(entry.maskSprite);
    }

    entry.maskSprite.destroy();

    this.masks.delete(mesh);
  },

  /**
   * Обновляем маски всех источников света.
   */
  updateMasks() {
    if (!canvas.ready || game.user.isGM) return;

    const visionMask = this.getVisionMask();
    if (!visionMask) return;

    for (const source of canvas.effects.lightSources.values()) {
      const lightDocument = this.getLightDocument(source);
      if (!lightDocument) continue;

      const shouldHideUnderFog = lightDocument.getFlag(
        this.MODULE_ID,
        this.FLAG_NAME
      ) === true;

      const meshes = [
        source.background,
        source.illumination,
        source.coloration
      ];

      for (const mesh of meshes) {
        if (!mesh) continue;

        if (shouldHideUnderFog) {
          this.applyMask(mesh, visionMask);
        } else {
          this.removeMask(mesh);
        }
      }
    }
  },

  /**
   * Запускаем обновление.
   */
  startTicker() {
    this.stopTicker();

    if (!canvas.ready || !canvas.app?.ticker) return;

    this.ticker = () => this.updateMasks();

    canvas.app.ticker.add(this.ticker);
    this.updateMasks();
  },

  /**
   * Останавливаем обновление и восстанавливаем меши.
   */
  stopTicker() {
    if (this.ticker && canvas.app?.ticker) {
      canvas.app.ticker.remove(this.ticker);
    }

    this.ticker = null;

    for (const source of canvas.effects?.lightSources?.values?.() ?? []) {
      for (const name of ["background", "illumination", "coloration"]) {
        this.removeMask(source[name]);
      }
    }
  }
};


/* -------------------------------------------- */
/* Hooks                                        */
/* -------------------------------------------- */

Hooks.on("renderAmbientLightConfig", (app, html) => {
  VisionLightMask.addCheckbox(app, html);
});

Hooks.on("canvasReady", () => {
  VisionLightMask.startTicker();
});

Hooks.on("canvasTearDown", () => {
  VisionLightMask.stopTicker();
});
