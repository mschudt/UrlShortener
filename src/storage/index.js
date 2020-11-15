export class StorageModule {

    constructor(databaseAccessor) {
        this.databaseAccessor = databaseAccessor;
    }

    store(id, content, lifetime, destroyAfterUse) {
        const createdAt = Date.now();
        this.databaseAccessor.add(new StoredObject(id, content, createdAt, lifetime, destroyAfterUse));
    }

    fetch(id) {
        return this.databaseAccessor.get(id);
    }

    remove(id) {
        this.databaseAccessor.remove(id);
    }

    startGarbageCollection(seconds) {
        // Register url cleanup timer that deletes URLs.
        // Run that check every n seconds.
        setInterval(() => this.databaseAccessor.cleanup(), seconds * 1000);
    }

}


export class DatabaseAccessor {
    constructor() {
        this.storage = {};
    }

    add(storedObject) {
        this.storage[storedObject.id] = storedObject;
    }

    get(id) {
        return this.storage[id];
    }

    remove(id) {
        delete this.storage[id];
    }

    cleanup() {
        const currentMillis = Date.now();

        for (const [id, storedObject] of Object.entries(this.storage)) {
            if (currentMillis - storedObject.createdAt >= storedObject.lifetime) {
                delete this.storage[id];
            }
        }
    }
}

export class StoredObject {
    constructor(id, content, type, createdAt, lifetime, destroyAfterUse) {
        this.id = id;
        this.content = content;
        this.type = type;
        this.createdAt = createdAt;
        this.lifetime = lifetime;
        this.destroyAfterUse = destroyAfterUse;
    }
}
