export class StorageModule {

    constructor(databaseAccessor) {
        this.databaseAccessor = databaseAccessor;
    }

    store(id, content, type, lifetime, destroyAfterUse) {
        const createdAt = Date.now();
        return this.databaseAccessor.add(new StoredObject(id, content, type, createdAt, lifetime, destroyAfterUse));
    }

    fetch(id) {
        return this.databaseAccessor.get(id);
    }

    remove(id) {
        return this.databaseAccessor.remove(id);
    }

    has(id) {
        return this.databaseAccessor.has(id);
    }

    startGarbageCollection(seconds) {
        // Register url cleanup timer that deletes URLs.
        // Run that check every n seconds.
        setInterval(() => this.databaseAccessor.cleanup(), seconds * 1000);
    }

}

export const StoreResult = Object.freeze({
    STORED: "stored",
    CONFLICT: "conflict",
    CAPACITY: "capacity",
});

export class DatabaseAccessor {
    constructor({maxEntries = Infinity, maxBytes = Infinity} = {}) {
        this.storage = new Map();
        this.maxEntries = maxEntries;
        this.maxBytes = maxBytes;
        this.storedBytes = 0;
    }

    add(storedObject) {
        if (this.storage.has(storedObject.id)) {
            return StoreResult.CONFLICT;
        }

        if (this.storage.size >= this.maxEntries || this.storedBytes + storedObject.contentBytes > this.maxBytes) {
            return StoreResult.CAPACITY;
        }

        this.storage.set(storedObject.id, storedObject);
        this.storedBytes += storedObject.contentBytes;
        return StoreResult.STORED;
    }

    get(id) {
        return this.storage.get(id);
    }

    has(id) {
        return this.storage.has(id);
    }

    remove(id) {
        const storedObject = this.storage.get(id);
        if (storedObject === undefined) {
            return false;
        }

        this.storage.delete(id);
        this.storedBytes -= storedObject.contentBytes;
        return true;
    }

    cleanup() {
        const currentMillis = Date.now();

        for (const [id, storedObject] of this.storage.entries()) {
            if (currentMillis - storedObject.createdAt >= storedObject.lifetime) {
                this.remove(id);
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
        this.contentBytes = Buffer.byteLength(content, "utf8");
    }
}
