/**
 * AuraFit App Logic
 * Precision Longevity & Performance Tracking
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // App State
    const state = {
        currentView: 'home',
        activeCategory: null,
        activeWorkout: null,
        currentExerciseIndex: 0,
        currentSet: 1,
        reps: 0,
        targetReps: 12,
        isResting: false,
        restTimeRemaining: 0,
        stats: JSON.parse(localStorage.getItem('aurafit_stats')) || {
            weeklyVolume: [12000, 15000, 11000, 18000, 14000, 21000, 16000],
            completedWorkouts: 0,
            totalMinutes: 0
        }
    };

    // Workout Data
    const workoutData = {
        strength: {
            title: "Strength & Hypertrophy",
            desc: "Focus on mechanical tension and metabolic stress.",
            programs: [
                { id: 's1', name: "Push: Hypertrophy", duration: "55m", level: "Intermediate", exercises: [
                    { name: "Incline DB Press", sets: 4, reps: 10 },
                    { name: "Overhead Press", sets: 3, reps: 8 },
                    { name: "Lateral Raises", sets: 3, reps: 15 }
                ]},
                { id: 's2', name: "Pull: Raw Power", duration: "60m", level: "Advanced", exercises: [
                    { name: "Deadlifts", sets: 5, reps: 5 },
                    { name: "Weighted Pullups", sets: 4, reps: 6 },
                    { name: "Barbell Rows", sets: 3, reps: 10 }
                ]},
                { id: 's3', name: "Leg Day: Foundation", duration: "65m", level: "All Levels", exercises: [
                    { name: "Back Squats", sets: 4, reps: 8 },
                    { name: "Leg Press", sets: 3, reps: 12 },
                    { name: "Calf Raises", sets: 4, reps: 15 }
                ]}
            ]
        },
        cardio: {
            title: "VO2 Max Endurance",
            desc: "Optimize cardiovascular efficiency and aerobic base.",
            programs: [
                { id: 'c1', name: "HIIT: Tabata Sprints", duration: "20m", level: "Advanced", exercises: [
                    { name: "Sprints", sets: 8, reps: 20 },
                    { name: "Burpees", sets: 4, reps: 15 }
                ]},
                { id: 'c2', name: "Zone 2: Steady State", duration: "45m", level: "Beginner", exercises: [
                    { name: "Incline Walk", sets: 1, reps: 45 }
                ]}
            ]
        },
        recovery: {
            title: "Restorative Mobility",
            desc: "Active recovery to accelerate tissue repair.",
            programs: [
                { id: 'r1', name: "Full Body Flow", duration: "30m", level: "Beginner", exercises: [
                    { name: "Cat-Cow", sets: 3, reps: 10 },
                    { name: "Hip Openers", sets: 2, reps: 12 }
                ]}
            ]
        }
    };

    // DOM Elements
    const views = document.querySelectorAll('.view');
    const navItems = document.querySelectorAll('.nav-item');
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    const navbar = document.getElementById('navbar');

    // Workout View Elements
    const workoutsList = document.getElementById('workouts-list');
    const categoryTitle = document.getElementById('category-title');
    const categoryDesc = document.getElementById('category-desc');

    // Active Workout Elements
    const activeWorkoutView = document.getElementById('view-active-workout');
    const repCounter = document.getElementById('rep-counter');
    const progressCircle = document.getElementById('progress-circle');
    const activeExerciseName = document.getElementById('active-exercise-name');
    const activeWorkoutName = document.getElementById('active-workout-name');
    const currentSetDisplay = document.getElementById('current-set');
    const restTimer = document.getElementById('rest-timer');
    const timerDisplay = document.getElementById('timer-display');

    // Modal Elements
    const modalContainer = document.getElementById('modal-container');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalConfirm = document.getElementById('modal-confirm');
    const modalCancel = document.getElementById('modal-cancel');
    const modalIcon = document.getElementById('modal-icon');

    // --- Utilities ---

    const vibrate = (ms = 50) => {
        if (navigator.vibrate) navigator.vibrate(ms);
    };

    const showModal = ({ title, message, icon = 'info', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) => {
        modalTitle.textContent = title;
        modalMessage.textContent = message;
        modalConfirm.textContent = confirmText;
        modalCancel.textContent = cancelText;
        modalIcon.setAttribute('data-lucide', icon);
        lucide.createIcons();

        if (cancelText === null) {
            modalCancel.classList.add('hidden');
        } else {
            modalCancel.classList.remove('hidden');
        }

        modalContainer.classList.remove('hidden');

        const handleConfirm = () => {
            modalContainer.classList.add('hidden');
            cleanup();
            if (onConfirm) onConfirm();
        };

        const handleCancel = () => {
            modalContainer.classList.add('hidden');
            cleanup();
            if (onCancel) onCancel();
        };

        const cleanup = () => {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
        };

        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
    };

    // --- Navigation Logic ---

    const showView = (viewId) => {
        views.forEach(v => v.classList.add('hidden'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.remove('hidden');
            state.currentView = viewId;
            window.scrollTo(0, 0); // Reset scroll on view change
        }

        // Desktop Landing Width Toggle
        if (viewId === 'home') {
            app.classList.add('landing-active');
        } else {
            app.classList.remove('landing-active');
        }

        // Update Nav UI
        navItems.forEach(item => {
            if (item.dataset.view === viewId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // Special handling for views
        if (viewId === 'stats') initStatsCharts();
        if (viewId === 'workouts' && !state.activeCategory) renderCategories();
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            vibrate(30);
            showView(item.dataset.view);
        });
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            vibrate(30);
            if (state.currentView === 'workouts' && state.activeCategory) {
                renderCategories();
            } else {
                showView('dashboard');
            }
        });
    });

    // --- Splash Logic ---
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.classList.add('hidden');
            app.classList.remove('hidden');
            navbar.classList.remove('hidden');

            showView('home'); // Show home by default
            initReadinessChart();

            // Add Promo Click Listener
            const promoBanner = document.querySelector('[alt="Promo"]')?.closest('.relative');
            if (promoBanner) {
                promoBanner.addEventListener('click', () => showView('gym'));
            }

            // View Promos Button
            const viewPromosBtn = document.getElementById('view-promos-btn');
            if (viewPromosBtn) {
                viewPromosBtn.addEventListener('click', () => {
                    document.getElementById('promo-section').scrollIntoView({ behavior: 'smooth' });
                });
            }
        }, 500);
    }, 2000);

    // --- Workout Logic ---

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            vibrate(30);
            const category = card.dataset.category;
            renderWorkouts(category);
            showView('workouts');
        });
    });

    const renderCategories = () => {
        state.activeCategory = null;
        categoryTitle.textContent = "Training";
        categoryDesc.textContent = "Select a discipline to explore programs.";

        const categories = [
            { id: 'strength', name: 'Strength & Hypertrophy', desc: 'Build raw power and lean muscle', img: 'https://skoop-dev-code-agent.s3.us-east-1.amazonaws.com/skoop-n8n-continue%2Faigen-1776171517676%2Fassets%2Fstrength_icon_noir-1776693228017.png' },
            { id: 'cardio', name: 'V02 Max Endurance', desc: 'Elevate cardiovascular threshold', img: 'https://skoop-dev-code-agent.s3.us-east-1.amazonaws.com/skoop-n8n-continue%2Faigen-1776171517676%2Fassets%2Fcardio_icon_noir-1776693248633.png' },
            { id: 'recovery', name: 'Restorative Mobility', desc: 'Deep tissue release and flow', img: 'https://skoop-dev-code-agent.s3.us-east-1.amazonaws.com/skoop-n8n-continue%2Faigen-1776171517676%2Fassets%2Frecovery_icon_noir-1776693274965.png' }
        ];

        workoutsList.innerHTML = categories.map(c => `
            <div class="category-card group flex items-center p-4 bg-graphite rounded-2xl border border-white/5 cursor-pointer hover:bg-aura/10 transition-colors" data-category="${c.id}">
                <div class="w-16 h-16 rounded-xl bg-carbon p-2 flex items-center justify-center mr-4 overflow-hidden">
                    <img src="${c.img}" class="w-full h-full object-contain transform group-hover:scale-110 transition-transform" alt="${c.name}">
                </div>
                <div class="flex-grow">
                    <h4 class="font-bold">${c.name}</h4>
                    <p class="text-xs text-clay">${c.desc}</p>
                </div>
                <i data-lucide="chevron-right" class="text-clay w-5 h-5"></i>
            </div>
        `).join('');

        lucide.createIcons();

        // Re-attach click listeners to the newly rendered cards
        workoutsList.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                vibrate(30);
                const category = card.dataset.category;
                renderWorkouts(category);
            });
        });
    };

    const renderWorkouts = (category) => {
        state.activeCategory = category;
        const data = workoutData[category];
        categoryTitle.textContent = data.title;
        categoryDesc.textContent = data.desc;

        workoutsList.innerHTML = data.programs.map(p => `
            <div class="workout-item bg-graphite p-5 rounded-2xl border border-white/5 cursor-pointer flex justify-between items-center" data-id="${p.id}" data-category="${category}">
                <div class="space-y-1">
                    <h4 class="font-bold text-lg">${p.name}</h4>
                    <div class="flex items-center gap-3 text-xs text-clay">
                        <span class="flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i> ${p.duration}</span>
                        <span class="flex items-center gap-1"><i data-lucide="award" class="w-3 h-3"></i> ${p.level}</span>
                    </div>
                </div>
                <div class="w-10 h-10 rounded-full bg-aura/10 flex items-center justify-center text-aura">
                    <i data-lucide="play" class="w-5 h-5 fill-aura"></i>
                </div>
            </div>
        `).join('');

        lucide.createIcons();

        // Add Click Events to Workouts
        document.querySelectorAll('.workout-item').forEach(item => {
            item.addEventListener('click', () => {
                vibrate(50);
                const programId = item.dataset.id;
                const category = item.dataset.category;
                startWorkout(category, programId);
            });
        });
    };

    const startWorkout = (category, programId) => {
        const program = workoutData[category].programs.find(p => p.id === programId);
        state.activeWorkout = program;
        state.currentExerciseIndex = 0;
        state.currentSet = 1;
        state.reps = 0;

        updateWorkoutUI();
        activeWorkoutView.classList.remove('hidden');
        navbar.classList.add('hidden');
    };

    const updateWorkoutUI = () => {
        const exercise = state.activeWorkout.exercises[state.currentExerciseIndex];
        activeExerciseName.textContent = exercise.name;
        activeWorkoutName.textContent = state.activeWorkout.name;
        currentSetDisplay.textContent = state.currentSet;
        state.targetReps = exercise.reps;

        repCounter.textContent = state.reps;
        updateProgressCircle();
    };

    const updateProgressCircle = () => {
        const circumference = 2 * Math.PI * 120;
        const progress = Math.min(state.reps / state.targetReps, 1);
        const offset = circumference - (progress * circumference);
        progressCircle.style.strokeDashoffset = offset;
    };

    // --- Workout Actions ---

    document.getElementById('add-rep').addEventListener('click', () => {
        state.reps++;
        repCounter.textContent = state.reps;
        updateProgressCircle();

        // Tactile Feedback (Haptic Sim)
        vibrate(50);
    });

    document.getElementById('finish-set').addEventListener('click', () => {
        vibrate(70);
        const exercise = state.activeWorkout.exercises[state.currentExerciseIndex];

        if (state.currentSet < exercise.sets) {
            startRestTimer(90);
        } else if (state.currentExerciseIndex < state.activeWorkout.exercises.length - 1) {
            state.currentExerciseIndex++;
            state.currentSet = 1;
            state.reps = 0;
            startRestTimer(120);
        } else {
            completeWorkout();
        }
    });

    const startRestTimer = (seconds) => {
        state.isResting = true;
        state.restTimeRemaining = seconds;
        restTimer.classList.remove('hidden');

        const timer = setInterval(() => {
            state.restTimeRemaining--;
            const mins = Math.floor(state.restTimeRemaining / 60);
            const secs = state.restTimeRemaining % 60;
            timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

            if (state.restTimeRemaining <= 0 || !state.isResting) {
                clearInterval(timer);
                endRest();
            }
        }, 1000);
    };

    const endRest = () => {
        state.isResting = false;
        restTimer.classList.add('hidden');
        if (state.currentSet < state.activeWorkout.exercises[state.currentExerciseIndex].sets) {
            state.currentSet++;
        }
        state.reps = 0;
        updateWorkoutUI();
    };

    document.getElementById('skip-rest').addEventListener('click', () => {
        vibrate(30);
        state.isResting = false;
    });

    document.getElementById('close-workout').addEventListener('click', () => {
        vibrate(30);
        showModal({
            title: "End Session?",
            message: "Progress for this workout will not be saved if you exit now.",
            icon: "alert-triangle",
            confirmText: "End Session",
            cancelText: "Continue",
            onConfirm: () => {
                activeWorkoutView.classList.add('hidden');
                navbar.classList.remove('hidden');
            }
        });
    });

    const completeWorkout = () => {
        vibrate([100, 50, 100]);
        state.stats.completedWorkouts++;
        localStorage.setItem('aurafit_stats', JSON.stringify(state.stats));

        showModal({
            title: "Session Complete!",
            message: "Excellent work, Alex. Your stats have been updated and recovery protocols initiated.",
            icon: "trophy",
            confirmText: "Return to Dash",
            cancelText: null,
            onConfirm: () => {
                activeWorkoutView.classList.add('hidden');
                navbar.classList.remove('hidden');
                showView('dashboard');
            }
        });
    };

    // --- Charts Logic ---

    const initReadinessChart = () => {
        const ctx = document.getElementById('readinessChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [88, 12],
                    backgroundColor: ['#ffffff', '#111111'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                }]
            },
            options: {
                cutout: '80%',
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    };

    const initStatsCharts = () => {
        // Volume Bar Chart
        const volumeCtx = document.getElementById('volumeChart').getContext('2d');
        if (window.volumeChartInstance) window.volumeChartInstance.destroy();
        window.volumeChartInstance = new Chart(volumeCtx, {
            type: 'bar',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{
                    label: 'Volume (lbs)',
                    data: state.stats.weeklyVolume,
                    backgroundColor: '#ffffff',
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { display: false },
                    x: { grid: { display: false }, ticks: { color: '#888888', font: { size: 10 } } }
                },
                plugins: { legend: { display: false } }
            }
        });

        // Muscle Focus Radar Chart
        const focusCtx = document.getElementById('focusChart').getContext('2d');
        if (window.focusChartInstance) window.focusChartInstance.destroy();
        window.focusChartInstance = new Chart(focusCtx, {
            type: 'radar',
            data: {
                labels: ['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'],
                datasets: [{
                    label: 'Focus',
                    data: [80, 65, 90, 70, 55, 85],
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    pointBackgroundColor: '#ffffff',
                    pointRadius: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.1)' },
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        pointLabels: { color: '#888888', font: { size: 10, weight: 'bold' } },
                        ticks: { display: false },
                        suggestedMin: 0,
                        suggestedMax: 100
                    }
                },
                plugins: { legend: { display: false } }
            }
        });
    };
});
