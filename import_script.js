import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Setup Firebase exactly like the frontend
const firebaseConfig = {
    apiKey: "AIzaSyAOx-5L_GmTxImJ3XMGtqZhm592QafPjic",
    authDomain: "dailyworkapp-7f192.firebaseapp.com",
    projectId: "dailyworkapp-7f192",
    storageBucket: "dailyworkapp-7f192.firebasestorage.app",
    messagingSenderId: "868727315010",
    appId: "1:868727315010:web:3550f0f5aa9692e6ad6bdb"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// The user ID obtained from Firebase Auth (You will need to run the script with your UID)
const userId = process.argv[2];

if (!userId) {
    console.error("Please provide your Firebase User ID as an argument: node import_data.js <YOUR_UID>");
    process.exit(1);
}

// Raw Data
const rawData = [
    { date: "2025-09-22", desc: "setup : Cabocab project setup for diver app (partial setup)" },
    { date: "2025-09-23", desc: "setup & task : cabocab driver app setup completed.. then analyze the code and did some UI tasks like profile and rating style and position changes" },
    { date: "2025-09-24", desc: "task : analyze the code and add the download pdf button and their functionalities" },
    { date: "2025-10-06", desc: "get the dispatcher gmail, password and website details.. and analyze the booking cancelled issue." },
    { date: "2025-10-07", desc: "analyze the code and try to fix the booking cancelled issue (it occurs only one driver)" },
    { date: "2025-10-08", desc: "get the user-new-main project and analyze the user project files" },
    { date: "2025-10-09", desc: "fix : change the auto direction as per the driver facing direction" },
    { date: "2025-10-10", desc: "fix : change the mobile number(ad) type from Long to String and db setup locally.. fix : when the user click the ad in the second time while the user didn't give the allow permission for the first time. it will display the custom UI to redirect the permission settings." },
    { date: "2025-10-11", desc: "Saturday : holiday" },
    { date: "2025-10-12", desc: "Sunday : holiday" },
    { date: "2025-10-13", desc: "git : upload the updated code to the git.. then learn reactnative" },
    { date: "2025-10-14", desc: "no tasks given : so learn the reactnative and express" },
    { date: "2025-10-15", desc: "diwali holiday" },
    { date: "2025-10-27", desc: "MediConnect : register page work" },
    { date: "2025-10-28", desc: "test : coupan project testing with suman bro" },
    { date: "2025-10-29", desc: "MediConnect : protected route and learn about jsonwebtoken" },
    { date: "2025-10-30", desc: "leave : for internal exam and practical" },
    { date: "2025-11-06", desc: "reactnative learning" },
    { date: "2025-11-07", desc: "sem holidays" },
    { date: "2025-12-07", desc: "leave" },
    { date: "2025-12-15", desc: "task and setup : Reactnative task and koopanz customer app setup completed partially" },
    { date: "2025-12-16", desc: "test : Koopanz customer and merchant application" },
    { date: "2025-12-17", desc: "MediConnect : Mobile app creation for MediConnect using Antigravity(Agent). medicine , doctor, lab test, pharmacy, profile,history ..." },
    { date: "2025-12-18", desc: "Mediconnect : AI Chatbot(Gemini API) and notification(firebase). some extra features creation and bug fixing." },
    { date: "2025-12-19", desc: "plan to build the rest mobile app , develop backend APIs and their functionalities of police login" },
    { date: "2025-12-20", desc: "Saturday leave : In hostel, working on backend APIs" },
    { date: "2025-12-21", desc: "Sunday leave : In hostel , working on backend APIs for admin login" },
    { date: "2025-12-22", desc: "develop : backend APIs" },
    { date: "2025-12-23", desc: "backend APIs" },
    { date: "2025-12-24", desc: "backend APIs" },
    { date: "2025-12-25", desc: "christmas leave" },
    { date: "2025-12-26", desc: "leave" },
    { date: "2025-12-27", desc: "saturday" },
    { date: "2025-12-28", desc: "sunday" },
    { date: "2025-12-29", desc: "develop : Techsquad websites" },
    { date: "2025-12-30", desc: "develop : TechSquad websites and MediConnect websites for doctor , labs and pharmacies" },
    { date: "2025-12-31", desc: "develop: web dashboards for MediConnect.., testing in koopanz" },
    { date: "2026-01-01", desc: "leave" },
    { date: "2026-01-06", desc: "create a new db table structure format" },
    { date: "2026-01-07", desc: "change the backend APIs as per the new db table structure" },
    { date: "2026-01-08", desc: "backend APIs for new db structure" },
    { date: "2026-01-09", desc: "leave (In house , Koopanz testing and backend APIs work )" },
    { date: "2026-01-19", desc: "backend APIs" },
    { date: "2026-01-20", desc: "web migration as per new db structure" },
    { date: "2026-01-21", desc: "web migration testing" },
    { date: "2026-01-22", desc: "web migration" },
    { date: "2026-01-23", desc: "In APP notification in rest mobile application" },
    { date: "2026-01-24", desc: "leave - fx tvl 1st round zoho" },
    { date: "2026-01-25", desc: "leave" },
    { date: "2026-01-26", desc: "leave" },
    { date: "2026-01-27", desc: "rest mobile app and koopanz - checkbox with terms of service and privacy policy" },
    { date: "2026-01-28", desc: "koopanz merchant app setup - setup not completed" },
    { date: "2026-01-29", desc: "whatsapp notification in rest mobile app and koopanz setup completed" },
    { date: "2026-01-30", desc: "learnings - dsa concepts" },
    { date: "2026-02-01", desc: "i did some work and took leave. i didn't remember what i did on that days." },
    { date: "2026-02-23", desc: "rest new features - notification reminder like that" }
];

async function importData() {
    let count = 0;
    for (const item of rawData) {
        try {
            await addDoc(collection(db, 'works'), {
                userId: userId,
                date: item.date,
                description: item.desc,
                createdAt: new Date().toISOString()
            });
            console.log(`Uploaded record for: ${item.date}`);
            count++;
        } catch (e) {
            console.error(`Error adding doc for ${item.date}: `, e);
        }
    }
    console.log(`\nImport complete! Successfully uploaded ${count} records.`);
    process.exit(0);
}

importData();
