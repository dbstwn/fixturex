
import { FormData, LogEntry, User, ActivityLog, UserRole, Feedback } from './types';
import { INITIAL_DATA } from './initialData';

const DB_NAME = 'FixtureX_DB';
const STORE_NAME = 'findings';
const LOGS_STORE_NAME = 'logs';
const USERS_STORE_NAME = 'users';
const ACTIVITY_STORE_NAME = 'activity_logs';
const FEEDBACK_STORE_NAME = 'feedbacks';
const DB_VERSION = 4; // Incremented for feedback store

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject('Error opening DB');

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(LOGS_STORE_NAME)) {
        db.createObjectStore(LOGS_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(USERS_STORE_NAME)) {
        const userStore = db.createObjectStore(USERS_STORE_NAME, { keyPath: 'id' });
        // Seed default users
        const defaultUsers: User[] = [
            { id: '1', name: 'Administrator', pin: '190925', role: UserRole.God, displayRole: 'Administrator' },
            { id: '2', name: 'Auditor', pin: '583922', role: UserRole.Admin, displayRole: 'Auditor' },
            { id: '3', name: 'Inspector', pin: '004093', role: UserRole.UserL1, displayRole: 'Inspector' },
            { id: '4', name: 'Guest', pin: '111111', role: UserRole.Viewer, displayRole: 'Guest' },
        ];
        defaultUsers.forEach(u => userStore.put(u));
      }
      if (!db.objectStoreNames.contains(ACTIVITY_STORE_NAME)) {
        db.createObjectStore(ACTIVITY_STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FEEDBACK_STORE_NAME)) {
        db.createObjectStore(FEEDBACK_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve();
  });
};

export const resetDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onsuccess = () => {
        const db = request.result;
        
        // Start a transaction on all stores
        const transaction = db.transaction(
            [STORE_NAME, LOGS_STORE_NAME, USERS_STORE_NAME, ACTIVITY_STORE_NAME, FEEDBACK_STORE_NAME], 
            'readwrite'
        );

        // 1. Clear Findings (Data)
        transaction.objectStore(STORE_NAME).clear();
        
        // 2. Clear Logs
        transaction.objectStore(LOGS_STORE_NAME).clear();
        
        // 3. Clear Activity Logs
        transaction.objectStore(ACTIVITY_STORE_NAME).clear();

        // 4. Clear Feedbacks
        transaction.objectStore(FEEDBACK_STORE_NAME).clear();

        // 5. Reset Users (Clear + Re-add Defaults to prevent lockout)
        const userStore = transaction.objectStore(USERS_STORE_NAME);
        userStore.clear();
        
        const defaultUsers: User[] = [
            { id: '1', name: 'Administrator', pin: '190925', role: UserRole.God, displayRole: 'Administrator' },
            { id: '2', name: 'Auditor', pin: '583922', role: UserRole.Admin, displayRole: 'Auditor' },
            { id: '3', name: 'Inspector', pin: '004093', role: UserRole.UserL1, displayRole: 'Inspector' },
            { id: '4', name: 'Guest', pin: '111111', role: UserRole.Viewer, displayRole: 'Guest' },
        ];
        defaultUsers.forEach(u => userStore.put(u));

        transaction.oncomplete = () => {
            db.close();
            // IMPORTANT: Set a flag to prevent auto-seeding initial data on next load
            localStorage.setItem('fixturex_is_wiped', 'true');
            resolve();
        };

        transaction.onerror = (e) => {
            console.error("Reset failed", e);
            reject("Transaction failed during reset");
        };
    };

    request.onerror = (e) => reject("Could not open DB for reset");
  });
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export const getAllFindings = (): Promise<FormData[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const data = req.result as FormData[];
        const isWiped = localStorage.getItem('fixturex_is_wiped');
        
        if (data.length === 0 && !isWiped) {
          INITIAL_DATA.forEach(item => store.put(item));
          resolve(INITIAL_DATA);
        } else {
          resolve(data);
        }
      };
      req.onerror = () => reject('Error fetching findings');
    };
    request.onerror = () => reject('Error opening DB');
  });
};

export const saveFinding = (data: FormData): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.put(data);
      req.onsuccess = () => resolve();
      req.onerror = () => reject('Error saving finding');
    };
    request.onerror = () => reject('Error opening DB');
  });
};

export const saveFindings = (data: FormData[]): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      data.forEach(item => store.put(item));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject('Error saving bulk findings');
    };
    request.onerror = () => reject('Error opening DB');
  });
};

export const deleteFinding = (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject('Error deleting finding');
    };
    request.onerror = () => reject('Error opening DB');
  });
};

export const saveLog = (log: LogEntry): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(LOGS_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(LOGS_STORE_NAME);
      const req = store.put(log);
      req.onsuccess = () => resolve();
      req.onerror = () => reject('Error saving log');
    };
    request.onerror = () => reject('Error opening DB');
  });
};

export const getAllLogs = (): Promise<LogEntry[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(LOGS_STORE_NAME, 'readonly');
      const store = transaction.objectStore(LOGS_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as LogEntry[]).reverse());
      req.onerror = () => reject('Error fetching logs');
    };
    request.onerror = () => reject('Error opening DB');
  });
};

export const getUsers = (): Promise<User[]> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(USERS_STORE_NAME, 'readonly');
            const store = transaction.objectStore(USERS_STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result as User[]);
            req.onerror = () => reject('Error fetching users');
        };
        request.onerror = () => reject('Error opening DB');
    });
};

export const saveUser = (user: User): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(USERS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(USERS_STORE_NAME);
            const req = store.put(user);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error saving user');
        };
        request.onerror = () => reject('Error opening DB');
    });
};

export const deleteUser = (id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(USERS_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(USERS_STORE_NAME);
            const req = store.delete(id);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error deleting user');
        };
        request.onerror = () => reject('Error opening DB');
    });
};

export const saveActivityLog = (log: ActivityLog): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(ACTIVITY_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(ACTIVITY_STORE_NAME);
            const req = store.put(log);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error saving activity log');
        };
        request.onerror = () => reject('Error opening DB');
    });
};

export const getActivityLogs = (): Promise<ActivityLog[]> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(ACTIVITY_STORE_NAME, 'readonly');
            const store = transaction.objectStore(ACTIVITY_STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve((req.result as ActivityLog[]).reverse());
            req.onerror = () => reject('Error fetching activity logs');
        };
        request.onerror = () => reject('Error opening DB');
    });
};

export const saveFeedback = (feedback: Feedback): Promise<void> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(FEEDBACK_STORE_NAME, 'readwrite');
            const store = transaction.objectStore(FEEDBACK_STORE_NAME);
            const req = store.put(feedback);
            req.onsuccess = () => resolve();
            req.onerror = () => reject('Error saving feedback');
        };
        request.onerror = () => reject('Error opening DB');
    });
};

export const getFeedbacks = (): Promise<Feedback[]> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction(FEEDBACK_STORE_NAME, 'readonly');
            const store = transaction.objectStore(FEEDBACK_STORE_NAME);
            const req = store.getAll();
            req.onsuccess = () => resolve((req.result as Feedback[]).reverse());
            req.onerror = () => reject('Error fetching feedbacks');
        };
        request.onerror = () => reject('Error opening DB');
    });
};
