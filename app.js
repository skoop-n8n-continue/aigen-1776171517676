/**
 * AuraFit App Logic
 * Precision Longevity & Performance Tracking
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // App State
    const state = {
        currentView: 'dashboard',
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

    // --- Navigation Logic ---

    const showView = (viewId) => {
        views.forEach(v => v.classList.add('hidden'));
        const targetView = document.getElementById(`view-${viewId}`);
        if (targetView) {
            targetView.classList.remove('hidden');
            state.currentView = viewId;
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
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => showView(item.dataset.view));
    });

    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => showView('dashboard'));
    });

    // --- Splash Logic ---
    setTimeout(() => {
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.classList.add('hidden');
            app.classList.remove('hidden');
            navbar.classList.remove('hidden');
            initReadinessChart();
        }, 500);
    }, 2000);

    // --- Workout Logic ---

    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            renderWorkouts(category);
            showView('workouts');
        });
    });

    const renderWorkouts = (category) => {
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
        if (navigator.vibrate) navigator.vibrate(50);
    });

    document.getElementById('finish-set').addEventListener('click', () => {
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
        state.isResting = false;
    });

    document.getElementById('close-workout').addEventListener('click', () => {
        if (confirm("End session early? Progress will not be saved.")) {
            activeWorkoutView.classList.add('hidden');
            navbar.classList.remove('hidden');
        }
    });

    const completeWorkout = () => {
        alert("Workout Complete! Excellent work.");
        state.stats.completedWorkouts++;
        localStorage.setItem('aurafit_stats', JSON.stringify(state.stats));

        activeWorkoutView.classList.add('hidden');
        navbar.classList.remove('hidden');
        showView('dashboard');
    };

    // --- Charts Logic ---

    const initReadinessChart = () => {
        const ctx = document.getElementById('readinessChart').getContext('2d');
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [88, 12],
                    backgroundColor: ['#ff3b30', '#1f2937'],
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
        const ctx = document.getElementById('volumeChart').getContext('2d');
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
                datasets: [{
                    label: 'Volume (lbs)',
                    data: state.stats.weeklyVolume,
                    backgroundColor: '#ff3b30',
                    borderRadius: 8,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { display: false },
                    x: { grid: { display: false }, ticks: { color: '#6a7071', font: { size: 10 } } }
                },
                plugins: { legend: { display: false } }
            }
        });
    };
});
