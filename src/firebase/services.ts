import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  runTransaction,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './config';
import { handleFirestoreError, OperationType } from './errorHandler';
import {
  Customer,
  Order,
  Payment,
  Machine,
  Material,
  PrintShopCompanySettings,
  UserProfile,
  UserRole,
  OrderStatus,
  PrintLog
} from '../types/printManager';
import { roundJOD, calculateAreaSqm, calculateLinearMeters } from '../utils/financial';

const ADMIN_EMAIL = 'h511alkayed@gmail.com';

export const companySettingsDefaults: PrintShopCompanySettings = {
  companyName: 'مطبعة برينت مانجر الحديثة',
  companyNameEn: 'Print Manager Professional Print Shop',
  companyPhone: '+962 6 555 1234',
  companyWhatsapp: '+962 7 9000 1234',
  companyEmail: 'info@printmanager.jo',
  companyAddress: 'عمان، المملكة الأردنية الهاشمية - شارع المدينة المنورة',
  taxNumber: '123456789-ض',
  currency: 'JOD',
  invoiceFooter: 'شكراً لتعاملكم معنا. البضاعة المباعة تفحص عند الاستلام. نسعد بخدمتكم دائماً.',
  logoUrl: ''
};

// -------------------------------------------------------------
// USER & RBAC
// -------------------------------------------------------------

export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null; photoURL?: string | null }): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  try {
    const snap = await getDoc(userRef);
    const isPrimaryAdmin = (user.email && user.email.toLowerCase() === ADMIN_EMAIL);
    const now = new Date().toISOString();

    if (snap.exists()) {
      const data = snap.data() as UserProfile;
      // If user is primary admin ensure role is admin
      let role = data.role;
      if (isPrimaryAdmin && role !== 'admin') {
        role = 'admin';
        await updateDoc(userRef, { role: 'admin', lastLogin: now });
      } else {
        await updateDoc(userRef, { lastLogin: now });
      }
      return {
        ...data,
        role,
        lastLogin: now,
      };
    } else {
      // First time user
      const initialRole: UserRole = isPrimaryAdmin ? 'admin' : 'employee';
      const newProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || user.email?.split('@')[0] || 'موظف مطبعة',
        role: initialRole,
        photoURL: user.photoURL || '',
        createdAt: now,
        lastLogin: now,
      };
      await setDoc(userRef, newProfile);
      if (initialRole === 'admin') {
        await setDoc(doc(db, 'admins', user.uid), { uid: user.uid, email: user.email, grantedAt: now });
      }
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
}

export function listenToUsers(callback: (users: UserProfile[]) => void): () => void {
  const usersRef = collection(db, 'users');
  return onSnapshot(usersRef, (snapshot) => {
    const list: UserProfile[] = [];
    snapshot.forEach(docSnap => {
      list.push(docSnap.data() as UserProfile);
    });
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'users');
  });
}

export async function updateUserRole(uid: string, newRole: UserRole): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const adminRef = doc(db, 'admins', uid);
  try {
    await updateDoc(userRef, { role: newRole });
    if (newRole === 'admin') {
      await setDoc(adminRef, { uid, grantedAt: new Date().toISOString() });
    } else {
      await deleteDoc(adminRef).catch(() => {});
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
  }
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------

export function listenToCompanySettings(callback: (settings: PrintShopCompanySettings) => void): () => void {
  const settingsDocRef = doc(db, 'settings', 'company');
  return onSnapshot(settingsDocRef, (snap) => {
    if (snap.exists()) {
      callback({ ...companySettingsDefaults, ...snap.data() } as PrintShopCompanySettings);
    } else {
      // Initialize defaults
      setDoc(settingsDocRef, companySettingsDefaults).catch(console.error);
      callback(companySettingsDefaults);
    }
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'settings/company');
  });
}

export async function updateCompanySettings(settings: Partial<PrintShopCompanySettings>): Promise<void> {
  const settingsDocRef = doc(db, 'settings', 'company');
  try {
    await setDoc(settingsDocRef, settings, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'settings/company');
  }
}

// -------------------------------------------------------------
// CUSTOMERS
// -------------------------------------------------------------

export function listenToCustomers(callback: (customers: Customer[]) => void): () => void {
  const colRef = collection(db, 'customers');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: Customer[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Customer);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'customers');
  });
}

export async function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalInvoiced' | 'totalPaid' | 'balance' | 'isArchived'>): Promise<string> {
  const colRef = collection(db, 'customers');
  const now = new Date().toISOString();
  try {
    const docRef = await addDoc(colRef, {
      ...customer,
      totalInvoiced: 0,
      totalPaid: 0,
      balance: 0,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'customers');
  }
}

export async function updateCustomer(id: string, updates: Partial<Customer>): Promise<void> {
  const docRef = doc(db, 'customers', id);
  try {
    await updateDoc(docRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
  }
}

export async function archiveCustomer(id: string, isArchived: boolean): Promise<void> {
  const docRef = doc(db, 'customers', id);
  try {
    await updateDoc(docRef, { isArchived, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
  }
}

// -------------------------------------------------------------
// ORDERS
// -------------------------------------------------------------

export function listenToOrders(callback: (orders: Order[]) => void): () => void {
  const colRef = collection(db, 'orders');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: Order[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Order);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'orders');
  });
}

export async function createOrder(orderData: Omit<Order, 'id' | 'paidAmount' | 'remainingBalance' | 'paymentStatus' | 'createdAt' | 'updatedAt' | 'statusHistory'>): Promise<string> {
  const now = new Date().toISOString();
  const initialHistory = [{
    status: orderData.status,
    changedAt: now,
    changedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'النظام',
    note: 'إنشاء أمر الطباعة',
  }];

  const total = roundJOD(orderData.totalAmount || 0);

  // Calculate items area and linear meters
  const processedItems = (orderData.items || []).map(item => {
    const area = calculateAreaSqm(item.widthCm, item.heightCm, item.quantity);
    const linear = calculateLinearMeters(item.widthCm, item.heightCm, item.quantity);
    return {
      ...item,
      totalAreaSqm: area,
      totalLinearMeters: linear,
      printedQuantity: item.printedQuantity || 0,
      wasteQuantity: item.wasteQuantity || 0,
    };
  });

  const totalAreaSqm = processedItems.length > 0
    ? roundJOD(processedItems.reduce((acc, it) => acc + (it.totalAreaSqm || 0), 0))
    : calculateAreaSqm(orderData.widthCm || 0, orderData.heightCm || 0, orderData.quantity || 1);

  const totalLinearMeters = processedItems.length > 0
    ? roundJOD(processedItems.reduce((acc, it) => acc + (it.totalLinearMeters || 0), 0))
    : calculateLinearMeters(orderData.widthCm || 0, orderData.heightCm || 0, orderData.quantity || 1);

  const newOrder: Omit<Order, 'id'> = {
    ...orderData,
    items: processedItems,
    totalAmount: total,
    paidAmount: 0,
    remainingBalance: total,
    printedQuantity: 0,
    wasteQuantity: 0,
    totalAreaSqm,
    totalLinearMeters,
    paymentStatus: 'unpaid',
    statusHistory: initialHistory,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const docRef = await addDoc(collection(db, 'orders'), newOrder);

    // Update customer totals
    if (orderData.customerId) {
      const custRef = doc(db, 'customers', orderData.customerId);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data() as Customer;
        const newTotalInvoiced = roundJOD((cData.totalInvoiced || 0) + total);
        const newBalance = roundJOD(newTotalInvoiced - (cData.totalPaid || 0));
        await updateDoc(custRef, {
          totalInvoiced: newTotalInvoiced,
          balance: newBalance,
          updatedAt: now,
        });
      }
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'orders');
  }
}

export async function updateOrder(id: string, updates: Partial<Order>): Promise<void> {
  const orderRef = doc(db, 'orders', id);
  const now = new Date().toISOString();
  try {
    const prevSnap = await getDoc(orderRef);
    if (!prevSnap.exists()) return;
    const prevData = prevSnap.data() as Order;

    // Recalculate remaining balance and payment status if total amount changed
    const newTotal = updates.totalAmount !== undefined ? roundJOD(updates.totalAmount) : prevData.totalAmount;
    const paid = prevData.paidAmount || 0;
    const remaining = roundJOD(Math.max(0, newTotal - paid));
    let paymentStatus = prevData.paymentStatus;
    if (paid >= newTotal && newTotal > 0) {
      paymentStatus = 'paid';
    } else if (paid > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'unpaid';
    }

    let statusHistory = prevData.statusHistory || [];
    if (updates.status && updates.status !== prevData.status) {
      statusHistory = [
        ...statusHistory,
        {
          status: updates.status,
          changedAt: now,
          changedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'المستخدم',
          note: `تغيير الحالة إلى ${updates.status}`,
        }
      ];
    }

    await updateDoc(orderRef, {
      ...updates,
      totalAmount: newTotal,
      remainingBalance: remaining,
      paymentStatus,
      statusHistory,
      updatedAt: now,
    });

    // Update customer balance if total changed
    if (updates.totalAmount !== undefined && prevData.customerId && newTotal !== prevData.totalAmount) {
      const diff = newTotal - prevData.totalAmount;
      const custRef = doc(db, 'customers', prevData.customerId);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data() as Customer;
        const newTotalInvoiced = roundJOD((cData.totalInvoiced || 0) + diff);
        const newBalance = roundJOD(newTotalInvoiced - (cData.totalPaid || 0));
        await updateDoc(custRef, {
          totalInvoiced: newTotalInvoiced,
          balance: newBalance,
          updatedAt: now,
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${id}`);
  }
}

export async function updateOrderStatus(orderId: string, newStatus: OrderStatus, note?: string): Promise<void> {
  const orderRef = doc(db, 'orders', orderId);
  const now = new Date().toISOString();
  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return;
    const data = snap.data() as Order;
    const updatedHistory = [
      ...(data.statusHistory || []),
      {
        status: newStatus,
        changedAt: now,
        changedBy: auth.currentUser?.displayName || auth.currentUser?.email || 'المستخدم',
        note: note || `تحديث حالة الإنتاج إلى ${newStatus}`,
      }
    ];
    await updateDoc(orderRef, {
      status: newStatus,
      statusHistory: updatedHistory,
      updatedAt: now,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
  }
}

export async function deleteOrder(id: string): Promise<void> {
  const orderRef = doc(db, 'orders', id);
  try {
    const snap = await getDoc(orderRef);
    if (!snap.exists()) return;
    const data = snap.data() as Order;

    // Adjust customer balance
    if (data.customerId) {
      const custRef = doc(db, 'customers', data.customerId);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data() as Customer;
        const newTotalInvoiced = roundJOD(Math.max(0, (cData.totalInvoiced || 0) - (data.totalAmount || 0)));
        const newTotalPaid = roundJOD(Math.max(0, (cData.totalPaid || 0) - (data.paidAmount || 0)));
        const newBalance = roundJOD(Math.max(0, newTotalInvoiced - newTotalPaid));
        await updateDoc(custRef, {
          totalInvoiced: newTotalInvoiced,
          totalPaid: newTotalPaid,
          balance: newBalance,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    await deleteDoc(orderRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `orders/${id}`);
  }
}

// -------------------------------------------------------------
// PAYMENTS
// -------------------------------------------------------------

export function listenToPayments(callback: (payments: Payment[]) => void): () => void {
  const colRef = collection(db, 'payments');
  const q = query(colRef, orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: Payment[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Payment);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'payments');
  });
}

export async function addPayment(paymentData: Omit<Payment, 'id' | 'createdAt'>): Promise<string> {
  const now = new Date().toISOString();
  const paymentAmount = roundJOD(paymentData.amount);

  try {
    const orderRef = doc(db, 'orders', paymentData.orderId);
    const orderSnap = await getDoc(orderRef);
    if (!orderSnap.exists()) {
      throw new Error('أمر الطباعة غير موجود');
    }
    const order = orderSnap.data() as Order;

    const currentPaid = order.paidAmount || 0;
    const newPaid = roundJOD(currentPaid + paymentAmount);
    const remaining = roundJOD(Math.max(0, order.totalAmount - newPaid));

    if (newPaid > order.totalAmount + 0.001) {
      throw new Error(`مجموع الدفعات (${newPaid} د.أ) يتجاوز إجمالي الطلب (${order.totalAmount} د.أ)`);
    }

    let paymentStatus = order.paymentStatus;
    if (remaining <= 0.001) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'partial';
    }

    // Save payment record
    const paymentDocRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      amount: paymentAmount,
      createdAt: now,
    });

    // Update order
    await updateDoc(orderRef, {
      paidAmount: newPaid,
      remainingBalance: remaining,
      paymentStatus,
      updatedAt: now,
    });

    // Update customer totals
    if (paymentData.customerId) {
      const custRef = doc(db, 'customers', paymentData.customerId);
      const custSnap = await getDoc(custRef);
      if (custSnap.exists()) {
        const cData = custSnap.data() as Customer;
        const updatedTotalPaid = roundJOD((cData.totalPaid || 0) + paymentAmount);
        const updatedBalance = roundJOD(Math.max(0, (cData.totalInvoiced || 0) - updatedTotalPaid));
        await updateDoc(custRef, {
          totalPaid: updatedTotalPaid,
          balance: updatedBalance,
          updatedAt: now,
        });
      }
    }

    return paymentDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'payments');
  }
}

// -------------------------------------------------------------
// PRINT LOGS & QUANTITY RECORDING
// -------------------------------------------------------------

export function listenToPrintLogs(callback: (logs: PrintLog[]) => void): () => void {
  const colRef = collection(db, 'printLogs');
  const q = query(colRef, orderBy('printedAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const items: PrintLog[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as PrintLog);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'printLogs');
  });
}

export async function recordPrintQuantity(logData: Omit<PrintLog, 'id' | 'createdAt'>): Promise<string> {
  const now = new Date().toISOString();
  try {
    // 1. Add print log entry
    const logDocRef = await addDoc(collection(db, 'printLogs'), {
      ...logData,
      createdAt: now,
    });

    // 2. Update Order items and progress
    if (logData.orderId) {
      const orderRef = doc(db, 'orders', logData.orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        const currentItems = order.items || [];

        let updatedItems = currentItems;
        if (logData.itemId && currentItems.length > 0) {
          updatedItems = currentItems.map(item => {
            if (item.id === logData.itemId) {
              const newPrinted = (item.printedQuantity || 0) + logData.quantityPrinted;
              const newWaste = (item.wasteQuantity || 0) + logData.wasteQuantity;
              return {
                ...item,
                printedQuantity: newPrinted,
                wasteQuantity: newWaste,
              };
            }
            return item;
          });
        }

        const totalPrinted = updatedItems.length > 0
          ? updatedItems.reduce((acc, it) => acc + (it.printedQuantity || 0), 0)
          : (order.printedQuantity || 0) + logData.quantityPrinted;

        const totalWaste = updatedItems.length > 0
          ? updatedItems.reduce((acc, it) => acc + (it.wasteQuantity || 0), 0)
          : (order.wasteQuantity || 0) + logData.wasteQuantity;

        const totalReq = order.quantity || 1;
        let newStatus = order.status;
        const newHistory = [...(order.statusHistory || [])];

        // Automatic Status Transitions
        if (totalPrinted >= totalReq && order.status !== 'ready' && order.status !== 'delivered' && order.status !== 'cancelled') {
          newStatus = 'ready';
          newHistory.push({
            status: 'ready',
            changedAt: now,
            changedBy: logData.operator || auth.currentUser?.displayName || 'المطبعة',
            note: `اكتمال كمية الطباعة المطلوبة (${totalPrinted} من ${totalReq} قطعة) - جاهز للتسليم`,
          });
        } else if ((order.status === 'new' || order.status === 'approved') && logData.quantityPrinted > 0) {
          newStatus = 'printing';
          newHistory.push({
            status: 'printing',
            changedAt: now,
            changedBy: logData.operator || auth.currentUser?.displayName || 'المطبعة',
            note: `بدء الطباعة - تسجيل دفعة (${logData.quantityPrinted} قطعة) على ماكينة ${logData.machineName}`,
          });
        }

        await updateDoc(orderRef, {
          items: updatedItems,
          printedQuantity: totalPrinted,
          wasteQuantity: totalWaste,
          status: newStatus,
          statusHistory: newHistory,
          updatedAt: now,
        });
      }
    }

    // 3. Update Machine Odometer / Counters
    if (logData.machineId) {
      const machineRef = doc(db, 'machines', logData.machineId);
      const machineSnap = await getDoc(machineRef);
      if (machineSnap.exists()) {
        const mData = machineSnap.data() as Machine;
        const newSqm = roundJOD((mData.totalPrintedSqm || 0) + (logData.areaSqm || 0));
        const newLinear = roundJOD((mData.totalPrintedLinearM || 0) + (logData.linearMeters || 0));
        const newPieces = (mData.totalPrintedPieces || 0) + (logData.quantityPrinted || 0);

        await updateDoc(machineRef, {
          totalPrintedSqm: newSqm,
          totalPrintedLinearM: newLinear,
          totalPrintedPieces: newPieces,
        });
      }
    }

    // 4. Automatically Deduct Material Stock Inventory
    if (logData.materialId) {
      const materialRef = doc(db, 'materials', logData.materialId);
      const matSnap = await getDoc(materialRef);
      if (matSnap.exists()) {
        const mat = matSnap.data() as Material;
        let deductAmount = 0;
        const unit = mat.unit?.toLowerCase() || '';

        if (unit.includes('متر مربع') || unit.includes('م²') || unit.includes('sqm')) {
          deductAmount = roundJOD(logData.areaSqm || 0);
        } else if (unit.includes('متر طولي') || unit.includes('م.ط') || unit.includes('linear')) {
          deductAmount = roundJOD(logData.linearMeters || 0);
        } else {
          // per piece, board, or unit
          deductAmount = logData.quantityPrinted + (logData.wasteQuantity || 0);
        }

        if (deductAmount > 0) {
          const currentStock = mat.stockQuantity || 0;
          const newStock = roundJOD(Math.max(0, currentStock - deductAmount));
          await updateDoc(materialRef, {
            stockQuantity: newStock,
          });
        }
      }
    }

    return logDocRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'printLogs');
  }
}

export async function deletePrintLog(logId: string): Promise<void> {
  const docRef = doc(db, 'printLogs', logId);
  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return;
    const log = snap.data() as PrintLog;

    // Rollback order quantities
    if (log.orderId) {
      const orderRef = doc(db, 'orders', log.orderId);
      const orderSnap = await getDoc(orderRef);
      if (orderSnap.exists()) {
        const order = orderSnap.data() as Order;
        const items = (order.items || []).map(item => {
          if (item.id === log.itemId) {
            return {
              ...item,
              printedQuantity: Math.max(0, (item.printedQuantity || 0) - log.quantityPrinted),
              wasteQuantity: Math.max(0, (item.wasteQuantity || 0) - log.wasteQuantity),
            };
          }
          return item;
        });

        const totalPrinted = items.length > 0
          ? items.reduce((acc, it) => acc + (it.printedQuantity || 0), 0)
          : Math.max(0, (order.printedQuantity || 0) - log.quantityPrinted);

        const totalWaste = items.length > 0
          ? items.reduce((acc, it) => acc + (it.wasteQuantity || 0), 0)
          : Math.max(0, (order.wasteQuantity || 0) - log.wasteQuantity);

        await updateDoc(orderRef, {
          items,
          printedQuantity: totalPrinted,
          wasteQuantity: totalWaste,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Rollback machine counters
    if (log.machineId) {
      const machineRef = doc(db, 'machines', log.machineId);
      const machineSnap = await getDoc(machineRef);
      if (machineSnap.exists()) {
        const mData = machineSnap.data() as Machine;
        await updateDoc(machineRef, {
          totalPrintedSqm: Math.max(0, roundJOD((mData.totalPrintedSqm || 0) - (log.areaSqm || 0))),
          totalPrintedLinearM: Math.max(0, roundJOD((mData.totalPrintedLinearM || 0) - (log.linearMeters || 0))),
          totalPrintedPieces: Math.max(0, (mData.totalPrintedPieces || 0) - (log.quantityPrinted || 0)),
        });
      }
    }

    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `printLogs/${logId}`);
  }
}

// -------------------------------------------------------------
// MACHINES
// -------------------------------------------------------------

export function listenToMachines(callback: (machines: Machine[]) => void): () => void {
  const colRef = collection(db, 'machines');
  return onSnapshot(colRef, (snapshot) => {
    const items: Machine[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Machine);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'machines');
  });
}

export async function addMachine(machine: Omit<Machine, 'id' | 'createdAt'>): Promise<string> {
  const colRef = collection(db, 'machines');
  try {
    const docRef = await addDoc(colRef, {
      ...machine,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'machines');
  }
}

export async function updateMachine(id: string, updates: Partial<Machine>): Promise<void> {
  const docRef = doc(db, 'machines', id);
  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `machines/${id}`);
  }
}

export async function deleteMachine(id: string): Promise<void> {
  const docRef = doc(db, 'machines', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `machines/${id}`);
  }
}

// -------------------------------------------------------------
// MATERIALS
// -------------------------------------------------------------

export function listenToMaterials(callback: (materials: Material[]) => void): () => void {
  const colRef = collection(db, 'materials');
  return onSnapshot(colRef, (snapshot) => {
    const items: Material[] = [];
    snapshot.forEach(docSnap => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Material);
    });
    callback(items);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'materials');
  });
}

export async function addMaterial(material: Omit<Material, 'id' | 'createdAt' | 'isArchived'>): Promise<string> {
  const colRef = collection(db, 'materials');
  try {
    const docRef = await addDoc(colRef, {
      ...material,
      isArchived: false,
      createdAt: new Date().toISOString(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, 'materials');
  }
}

export async function updateMaterial(id: string, updates: Partial<Material>): Promise<void> {
  const docRef = doc(db, 'materials', id);
  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `materials/${id}`);
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  const docRef = doc(db, 'materials', id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `materials/${id}`);
  }
}

// -------------------------------------------------------------
// SEED INITIAL DATA IF EMPTY
// -------------------------------------------------------------

export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const machinesSnap = await getDocs(collection(db, 'machines'));
    if (machinesSnap.empty) {
      const defaultMachines: Omit<Machine, 'id'>[] = [
        { name: 'ماكينة يو في مسطح (UV Flatbed 2513)', code: 'M-UV01', type: 'UV Flatbed', maxPrintWidthCm: 250, status: 'active', createdAt: new Date().toISOString() },
        { name: 'ماكينة إيكو سولفنت رول (Roland Eco-Solvent 160)', code: 'M-ECO01', type: 'Eco-Solvent', maxPrintWidthCm: 160, status: 'active', createdAt: new Date().toISOString() },
        { name: 'ماكينة سولفنت خارجية (Solvent 320cm)', code: 'M-SOLV01', type: 'Solvent Large Format', maxPrintWidthCm: 320, status: 'active', createdAt: new Date().toISOString() },
        { name: 'ماكينة طباعة دي تي إف (DTF Textile Printer 60cm)', code: 'M-DTF01', type: 'DTF Textile', maxPrintWidthCm: 60, status: 'active', createdAt: new Date().toISOString() },
        { name: 'ماكينة راوتر سي إن سي (CNC Router 2040)', code: 'M-CNC01', type: 'CNC Router', maxPrintWidthCm: 200, status: 'active', createdAt: new Date().toISOString() },
        { name: 'ماكينة قص ليزر (Laser Cutter 1390)', code: 'M-LASER01', type: 'Laser Cutter', maxPrintWidthCm: 130, status: 'active', createdAt: new Date().toISOString() }
      ];
      for (const m of defaultMachines) {
        await addDoc(collection(db, 'machines'), m);
      }
    }

    const materialsSnap = await getDocs(collection(db, 'materials'));
    if (materialsSnap.empty) {
      const defaultMaterials: Omit<Material, 'id'>[] = [
        { name: 'فليكس بانر كوري 440g', category: 'بانر وفليكس', unit: 'متر مربع (م²)', costPerUnit: 1.200, sellPricePerUnit: 3.500, stockQuantity: 450, minStockThreshold: 100, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'فينيل لاصق أبيض مطفي / لامع', category: 'لاصق وفينيل', unit: 'متر مربع (م²)', costPerUnit: 0.900, sellPricePerUnit: 2.800, stockQuantity: 600, minStockThreshold: 150, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'أكريليك شفاف 3 ملم', category: 'ألواح صلبة', unit: 'لوح (244*122)', costPerUnit: 18.000, sellPricePerUnit: 32.000, stockQuantity: 40, minStockThreshold: 10, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'فوم بورد 5 ملم مضغوط', category: 'ألواح صلبة', unit: 'لوح (244*122)', costPerUnit: 5.500, sellPricePerUnit: 12.000, stockQuantity: 80, minStockThreshold: 20, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'فيلم يو في دي تي إف A/B', category: 'دي تي إف', unit: 'متر طولي (م.ط)', costPerUnit: 2.500, sellPricePerUnit: 6.000, stockQuantity: 200, minStockThreshold: 50, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'ورق دي تي إف للملابس', category: 'دي تي إف', unit: 'متر طولي (م.ط)', costPerUnit: 1.800, sellPricePerUnit: 4.500, stockQuantity: 300, minStockThreshold: 80, isArchived: false, createdAt: new Date().toISOString() },
        { name: 'ماش بانر شبك مخرم (Mesh)', category: 'بانر وفليكس', unit: 'متر مربع (م²)', costPerUnit: 1.500, sellPricePerUnit: 4.000, stockQuantity: 180, minStockThreshold: 50, isArchived: false, createdAt: new Date().toISOString() }
      ];
      for (const mat of defaultMaterials) {
        await addDoc(collection(db, 'materials'), mat);
      }
    }

    const customersSnap = await getDocs(collection(db, 'customers'));
    if (customersSnap.empty) {
      const sampleCustomer: Omit<Customer, 'id'> = {
        customerNumber: 'CUST-1001',
        name: 'م. أحمد العبداللات',
        companyName: 'شركة الإبداع للتسويق والإعلان',
        phone: '0795551234',
        whatsapp: '0795551234',
        address: 'عمان - شارع وصفي التل (الجاردنز)',
        email: 'creative@example.jo',
        notes: 'عميل مميز - خصم 10% على الكميات الكبيرة',
        totalInvoiced: 0,
        totalPaid: 0,
        balance: 0,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addDoc(collection(db, 'customers'), sampleCustomer);
    }
  } catch (e) {
    console.warn('Seeding check:', e);
  }
}
