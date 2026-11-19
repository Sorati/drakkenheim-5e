
/**
 * Drakkenheim 5e
 * Always Visible Tiles
 *
 * Foundry VTT v14
 *
 * Позволяет отображать отмеченные тайлы
 * поверх тумана войны.
 *
 * Дополнительно:
 * Кнопка быстрого переключения в Tile HUD.
 */

const ZBLAlwaysVisibleTiles = {
  MODULE_ID: "drakkenheim-5e",
  FLAG: "alwaysVisible",

  // Хранилище визуальных копий тайлов.
  sprites: new Map(),

  // Хранилище ожидающих обновлений.
  pendingSync: new Map(),

  // Обработчик обновления копий каждый кадр.
  ticker: null,
  tickerCallback: null,


  /* =========================================
     ОБЩИЕ ФУНКЦИИ
  ========================================= */

  /**
   * Получить HTML-элемент окна.
   */
  getRoot(app, element) {
    if (element instanceof HTMLElement) return element;
    if (element?.[0] instanceof HTMLElement) return element[0];

    if (app?.element instanceof HTMLElement) return app.element;
    if (app?.element?.[0] instanceof HTMLElement) return app.element[0];

    return null;
  },


  /* =========================================
     НАСТРОЙКИ ТАЙЛОВ
  ========================================= */

  /**
   * Добавление галочки в настройки тайла.
   */
  onRenderConfig(app, element) {
    const tile = app?.document;

    if (tile?.documentName !== "Tile") return;

    const root = this.getRoot(app, element);
    if (!root) return;

    const overheadTab = root.matches(
      '[data-application-part="overhead"]'
    )
      ? root
      : root.querySelector('[data-application-part="overhead"]');

    if (!overheadTab) return;

    if (overheadTab.querySelector("#drakkenheim-always-visible")) return;

    const wrapper = document.createElement("div");
    wrapper.className = "form-group";
    wrapper.style.marginTop = "12px";

    const label = document.createElement("label");
    label.htmlFor = "drakkenheim-always-visible";
    label.textContent = "Всегда отображать поверх тумана войны";

    const control = document.createElement("div");
    control.className = "form-fields";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "drakkenheim-always-visible";

    checkbox.checked = Boolean(
      tile.getFlag(this.MODULE_ID, this.FLAG)
    );

    const hint = document.createElement("p");
    hint.className = "hint";
    hint.textContent =
      "Отображает тайл игрокам даже в неисследованной области.";

    control.appendChild(checkbox);
    wrapper.append(label, control, hint);
    overheadTab.appendChild(wrapper);

    checkbox.addEventListener("change", async () => {
      checkbox.disabled = true;

      try {
        await tile.setFlag(
          this.MODULE_ID,
          this.FLAG,
          checkbox.checked
        );

        console.log(
          "Drakkenheim 5e | Флаг тайла сохранён:",
          tile.id,
          checkbox.checked
        );

      } catch (error) {
        console.error(
          "Drakkenheim 5e | Ошибка сохранения флага:",
          error
        );

        checkbox.checked = Boolean(
          tile.getFlag(this.MODULE_ID, this.FLAG)
        );

      } finally {
        checkbox.disabled = false;
      }
    });

    console.log(
      "Drakkenheim 5e | Галочка добавлена:",
      tile.id
    );
  },


  /* =========================================
     КНОПКА БЫСТРОГО ДОСТУПА HUD
  ========================================= */

  /**
   * Обновление внешнего вида кнопки.
   */
  updateHUDButton(button, enabled) {
    if (!button) return;

    button.innerHTML = enabled
      ? '<i class="fa-solid fa-thumbtack"></i>'
      : '<i class="fa-solid fa-thumbtack-slash"></i>';

    button.title = enabled
      ? "Отключить отображение поверх тумана войны"
      : "Отображать поверх тумана войны";

    button.setAttribute("aria-label", button.title);

    button.classList.toggle("active", enabled);
  },

  /**
   * Добавление кнопки в правую колонку HUD тайла.
   */

  /**
   * Добавление кнопки в правую колонку HUD тайла.
   */
  onRenderHUD(app, element) {
    const tile =
      app?.document ??
      app?.object?.document;

    if (tile?.documentName !== "Tile") return;

    // Находим корневую форму HUD.
    let root = null;

    if (element instanceof HTMLElement) {
      root = element.matches("#tile-hud")
        ? element
        : element.querySelector("#tile-hud");
    }

    // Дополнительный поиск через само приложение.
    if (!root && app?.element instanceof HTMLElement) {
      root = app.element.matches("#tile-hud")
        ? app.element
        : app.element.querySelector("#tile-hud");
    }

    if (!root) {
      console.warn(
        "Drakkenheim 5e | Не найден корневой элемент Tile HUD."
      );
      return;
    }

    const rightColumn = root.querySelector(".col.right");

    if (!rightColumn) {
      console.warn(
        "Drakkenheim 5e | Не найдена правая колонка HUD."
      );
      return;
    }

    // Защита от повторного создания кнопки.
    if (
      rightColumn.querySelector(
        '[data-action="drakkenheim-always-visible"]'
      )
    ) return;

    const button = document.createElement("button");

    button.type = "button";
    button.className = "control-icon";
    button.dataset.action = "drakkenheim-always-visible";

    const enabled = Boolean(
      tile.getFlag(this.MODULE_ID, this.FLAG)
    );

    this.updateHUDButton(button, enabled);

    button.addEventListener("click", async event => {
      event.preventDefault();
      event.stopPropagation();

      if (button.disabled) return;

      button.disabled = true;

      try {
        const currentState = Boolean(
          tile.getFlag(this.MODULE_ID, this.FLAG)
        );

        const newState = !currentState;

        await tile.setFlag(
          this.MODULE_ID,
          this.FLAG,
          newState
        );

        this.updateHUDButton(button, newState);

        console.log(
          "Drakkenheim 5e | HUD: состояние тайла изменено:",
          tile.id,
          newState
        );

      } catch (error) {
        console.error(
          "Drakkenheim 5e | HUD: ошибка переключения:",
          error
        );

        this.updateHUDButton(
          button,
          Boolean(tile.getFlag(this.MODULE_ID, this.FLAG))
        );

      } finally {
        button.disabled = false;
      }
    });

    rightColumn.appendChild(button);

    console.log(
      "Drakkenheim 5e | Кнопка HUD успешно добавлена:",
      tile.id
    );
  },



  /* =========================================
     ОТОБРАЖЕНИЕ ПОВЕРХ ТУМАНА ВОЙНЫ
  ========================================= */

  /**
   * Обновление положения и внешнего вида копии.
   */
  updateSpriteTransform(sprite, mesh) {
    if (!sprite || !mesh) return;

    if (mesh.texture && sprite.texture !== mesh.texture) {
      sprite.texture = mesh.texture;
    }

    sprite.anchor.set(
      mesh.anchor?.x ?? 0,
      mesh.anchor?.y ?? 0
    );

    sprite.position.copyFrom(mesh.position);
    sprite.scale.copyFrom(mesh.scale);
    sprite.pivot.copyFrom(mesh.pivot);

    if (mesh.skew) {
      sprite.skew.copyFrom(mesh.skew);
    }

    sprite.rotation = mesh.rotation;
    sprite.alpha = mesh.alpha;
    sprite.tint = mesh.tint;
    sprite.blendMode = mesh.blendMode;
  },

  /**
   * Запуск постоянного обновления копий.
   */
  startTicker() {
    if (this.tickerCallback) return;

    const ticker = canvas.app?.ticker;

    if (!ticker) {
      console.warn(
        "Drakkenheim 5e | Не удалось запустить обновление копий: ticker недоступен."
      );
      return;
    }

    this.ticker = ticker;

    this.tickerCallback = () => {
      this.updateSprites();
    };

    this.ticker.add(this.tickerCallback);
  },

  /**
   * Обновление копий каждый кадр.
   */
  updateSprites() {
    if (!canvas?.ready) return;

    for (const [tileId, sprite] of this.sprites) {
      const tile = canvas.tiles.placeables.find(
        t => t.id === tileId
      );

      if (!tile?.mesh) continue;

      const document = tile.document;

      // Если галочку сняли, удаляем копию.
      if (!document.getFlag(this.MODULE_ID, this.FLAG)) {
        this.removeSprite(tileId);
        continue;
      }

      // Учитываем скрытие тайла мастером.
      if (document.hidden && !game.user.isGM) {
        this.removeSprite(tileId);
        continue;
      }

      this.updateSpriteTransform(sprite, tile.mesh);
    }
  },

  /**
   * Остановка постоянного обновления копий.
   */
  stopTicker() {
    if (this.ticker && this.tickerCallback) {
      this.ticker.remove(this.tickerCallback);
    }

    this.ticker = null;
    this.tickerCallback = null;
  },

  /**
   * Создание визуальной копии тайла.
   */
  createSprite(tile) {
    if (!tile?.mesh || !canvas?.interface) return;

    const document = tile.document;
    const mesh = tile.mesh;

    if (!document.getFlag(this.MODULE_ID, this.FLAG)) return;

    // Не показываем игрокам тайлы,
    // которые GM специально скрыл.
    if (document.hidden && !game.user.isGM) return;

    if (!mesh.texture) return;

    // Удаляем предыдущую копию.
    this.removeSprite(document.id);

    const sprite = new PIXI.Sprite(mesh.texture);

    // Копируем трансформации оригинала.
    this.updateSpriteTransform(sprite, mesh);

    // Копия не должна перехватывать взаимодействия.
    sprite.eventMode = "none";
    sprite.interactive = false;

    sprite.name = `drakkenheim-always-visible-${document.id}`;

    // Добавляем копию поверх тумана войны.
    canvas.interface.addChild(sprite);

    this.sprites.set(document.id, sprite);

    console.log(
      "Drakkenheim 5e | Создана копия тайла:",
      document.id,
      "| Клиент:",
      game.user.name
    );
  },

  /**
   * Удаление визуальной копии.
   */
  removeSprite(tileId) {
    const sprite = this.sprites.get(tileId);

    if (!sprite) return;

    sprite.parent?.removeChild(sprite);
    sprite.destroy();

    this.sprites.delete(tileId);
  },

  /**
   * Обновление одного тайла.
   */
  syncTile(tileId) {
    if (!canvas?.ready || !canvas.interface) return;

    const tile = canvas.tiles.placeables.find(
      t => t.id === tileId
    );

    this.removeSprite(tileId);

    if (tile) {
      this.createSprite(tile);
    }
  },

  /**
   * Обновление всех тайлов сцены.
   */
  syncAll() {
    if (!canvas?.ready || !canvas.interface) return;

    this.clearAll();

    for (const tile of canvas.tiles.placeables) {
      this.createSprite(tile);
    }

    this.startTicker();

    console.log(
      "Drakkenheim 5e | Обновление копий завершено. Клиент:",
      game.user.name
    );
  },

  /**
   * Удаление всех копий.
   */
  clearAll() {
    for (const tileId of [...this.sprites.keys()]) {
      this.removeSprite(tileId);
    }
  },

  /**
   * Отмена ожидающего обновления.
   */
  cancelPendingSync(tileId) {
    const timer = this.pendingSync.get(tileId);

    if (timer !== undefined) {
      clearTimeout(timer);
      this.pendingSync.delete(tileId);
    }
  },

  /**
   * Ожидание появления тайла на холсте.
   */
  scheduleSync(tileId) {
    // Отменяем предыдущее ожидание.
    this.cancelPendingSync(tileId);

    if (!canvas?.ready) return;

    let attempts = 100;

    const check = () => {
      if (!canvas?.ready) {
        this.pendingSync.delete(tileId);
        return;
      }

      const tile = canvas.tiles.placeables.find(
        t => t.id === tileId
      );

      // Ждём появления объекта и его изображения.
      if (!tile?.mesh?.texture) {
        if (attempts > 0) {
          attempts--;

          const timer = setTimeout(check, 100);
          this.pendingSync.set(tileId, timer);
        } else {
          this.pendingSync.delete(tileId);

          console.warn(
            "Drakkenheim 5e | Не удалось дождаться тайла:",
            tileId,
            "| Клиент:",
            game.user.name
          );
        }

        return;
      }

      this.pendingSync.delete(tileId);

      console.log(
        "Drakkenheim 5e | Тайл готов к синхронизации:",
        tileId,
        "| Клиент:",
        game.user.name
      );

      this.syncTile(tileId);
    };

    const timer = setTimeout(check, 100);
    this.pendingSync.set(tileId, timer);
  }
};


/* =========================================
   ОБРАБОТЧИКИ ОКОН
========================================= */

// Настройки тайла и HUD.

Hooks.on("renderApplicationV2", (app, element) => {
  ZBLAlwaysVisibleTiles.onRenderConfig(app, element);
});

// Отдельный обработчик HUD тайлов Foundry v14.
Hooks.on("renderTileHUD", (app, element) => {
  ZBLAlwaysVisibleTiles.onRenderHUD(app, element);
});



/* =========================================
   ЗАГРУЗКА И ЗАКРЫТИЕ СЦЕНЫ
========================================= */

// Сцена полностью загружена.
Hooks.on("canvasReady", () => {
  ZBLAlwaysVisibleTiles.syncAll();
});

// Сцена закрывается или переключается.
Hooks.on("canvasTearDown", () => {
  for (const tileId of [...ZBLAlwaysVisibleTiles.pendingSync.keys()]) {
    ZBLAlwaysVisibleTiles.cancelPendingSync(tileId);
  }

  ZBLAlwaysVisibleTiles.stopTicker();
  ZBLAlwaysVisibleTiles.clearAll();
});


/* =========================================
   СИНХРОНИЗАЦИЯ ТАЙЛОВ МЕЖДУ КЛИЕНТАМИ
========================================= */

// Создание нового тайла.
Hooks.on("createTile", document => {
  console.log(
    "Drakkenheim 5e | Получено событие createTile:",
    document.id,
    "| Клиент:",
    game.user.name
  );

  ZBLAlwaysVisibleTiles.scheduleSync(document.id);
});

// Изменение существующего тайла,
// включая установку и снятие нашей галочки.
Hooks.on("updateTile", document => {
  console.log(
    "Drakkenheim 5e | Получено событие updateTile:",
    document.id,
    "| Клиент:",
    game.user.name
  );

  // Убираем старую копию.
  // Если галочка осталась включена,
  // scheduleSync создаст новую.
  ZBLAlwaysVisibleTiles.removeSprite(document.id);

  ZBLAlwaysVisibleTiles.scheduleSync(document.id);
});

// Удаление тайла.
Hooks.on("deleteTile", document => {
  console.log(
    "Drakkenheim 5e | Получено событие deleteTile:",
    document.id,
    "| Клиент:",
    game.user.name
  );

  ZBLAlwaysVisibleTiles.cancelPendingSync(document.id);
  ZBLAlwaysVisibleTiles.removeSprite(document.id);
});


console.log("Drakkenheim 5e | tale-hide.js загружен.");
