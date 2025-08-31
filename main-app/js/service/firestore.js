// js/services/firestore.js
window.firestoreService = {
  saveProgress(uid, measurement) {
    return db.collection('users').doc(uid).collection('measurements').add({
      ...measurement,
      date: Date.now()
    });
  },
  getAllProgress(uid) {
    return db.collection('users').doc(uid).collection('measurements')
      .orderBy('date','asc').get()
      .then(snap => snap.docs.map(d=>d.data()));
  }
};
