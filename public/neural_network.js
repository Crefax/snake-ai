class NeuralNetwork {
    constructor() {
        this.inputSize = 11; // [foodDirX, foodDirY, foodDistance, dangerAhead, dangerLeft, dangerRight, tailNearby, isRepeatingMoves, lastReward, currentDirX, currentDirY]
        this.hiddenSize = 64;
        this.outputSize = 3;
        this.batchSize = 128;
        this.replayMemory = [];
        this.maxMemorySize = 50000;
        this.gamma = 0.95;
        this.epsilon = 1.0;
        this.epsilonMin = 0.01;
        this.epsilonDecay = 0.995;
        this.running = false;
        this.jenerasyon = 0;
        this.totalScore = 0;
        this.lastFoodDistance = 0;
        this.stepsWithoutFood = 0;
        this.maxStepsWithoutFood = 100;
        this.lastReward = 0;

        this.createModel();
        this.setupUI();
    }

    createModel() {
        this.model = tf.sequential();
        
        // Giriş katmanı
        this.model.add(tf.layers.dense({
            units: this.hiddenSize,
            activation: 'relu',
            inputShape: [this.inputSize],
            kernelInitializer: 'glorotUniform'
        }));
        
        // Dropout katmanı
        this.model.add(tf.layers.dropout({rate: 0.2}));
        
        // Gizli katmanlar
        this.model.add(tf.layers.dense({
            units: this.hiddenSize,
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
        }));

        this.model.add(tf.layers.dropout({rate: 0.2}));

        this.model.add(tf.layers.dense({
            units: this.hiddenSize / 2,
            activation: 'relu',
            kernelInitializer: 'glorotUniform'
        }));
        
        // Çıkış katmanı
        this.model.add(tf.layers.dense({
            units: this.outputSize,
            activation: 'linear'
        }));

        this.model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'meanSquaredError'
        });
    }

    setupUI() {
        document.getElementById('startAI').addEventListener('click', () => this.start());
        document.getElementById('stopAI').addEventListener('click', () => this.stop());
    }

    getState(gameState) {
        const head = window.game.snake[0];
        const directionVector = {
            'up': [0, -1],
            'down': [0, 1],
            'left': [-1, 0],
            'right': [1, 0]
        }[window.game.direction];

        const foodDistance = Math.sqrt(
            Math.pow(gameState.foodDirection.x, 2) + 
            Math.pow(gameState.foodDirection.y, 2)
        ) / Math.sqrt(Math.pow(window.game.canvas.width, 2) + Math.pow(window.game.canvas.height, 2));

        return [
            gameState.foodDirection.x / window.game.canvas.width,
            gameState.foodDirection.y / window.game.canvas.height,
            foodDistance,
            gameState.dangerAhead ? 1 : 0,
            gameState.dangerLeft ? 1 : 0,
            gameState.dangerRight ? 1 : 0,
            gameState.tailNearby ? 1 : 0,
            gameState.isRepeatingMoves ? 1 : 0,
            this.lastReward,
            directionVector[0],
            directionVector[1]
        ];
    }

    async predict(state) {
        if (Math.random() < this.epsilon) {
            return Math.floor(Math.random() * this.outputSize);
        }

        const stateTensor = tf.tensor2d([state], [1, this.inputSize]);
        const prediction = await this.model.predict(stateTensor).data();
        stateTensor.dispose();
        
        return prediction.indexOf(Math.max(...prediction));
    }

    remember(state, action, reward, nextState, done) {
        if (this.replayMemory.length >= this.maxMemorySize) {
            this.replayMemory.shift();
        }
        this.replayMemory.push({state, action, reward, nextState, done});
    }

    async replay() {
        if (this.replayMemory.length < this.batchSize) return 0;

        const batch = this.getRandomBatch();
        const states = tf.tensor2d(batch.map(exp => exp.state));
        const nextStates = tf.tensor2d(batch.map(exp => exp.nextState));

        const currentQs = await this.model.predict(states);
        const futureQs = await this.model.predict(nextStates);

        const x = [];
        const y = [];

        for (let i = 0; i < batch.length; i++) {
            const experience = batch[i];
            const current = await currentQs.data();
            const future = await futureQs.data();
            
            const currentQ = [...current.slice(i * this.outputSize, (i + 1) * this.outputSize)];
            const targetQ = [...currentQ];
            
            if (experience.done) {
                targetQ[experience.action] = experience.reward;
            } else {
                const maxFutureQ = Math.max(...future.slice(i * this.outputSize, (i + 1) * this.outputSize));
                targetQ[experience.action] = experience.reward + this.gamma * maxFutureQ;
            }
            
            x.push(experience.state);
            y.push(targetQ);
        }

        states.dispose();
        nextStates.dispose();
        currentQs.dispose();
        futureQs.dispose();

        const history = await this.model.fit(tf.tensor2d(x), tf.tensor2d(y), {
            batchSize: this.batchSize,
            epochs: 1,
            verbose: 0
        });

        if (this.epsilon > this.epsilonMin) {
            this.epsilon *= this.epsilonDecay;
        }

        return history.history.loss[0];
    }

    getRandomBatch() {
        const indices = new Set();
        while (indices.size < this.batchSize) {
            indices.add(Math.floor(Math.random() * this.replayMemory.length));
        }
        return Array.from(indices).map(index => this.replayMemory[index]);
    }

    actionToDirection(action) {
        return ['forward', 'left', 'right'][action];
    }

    calculateReward(moveResult, gameState) {
        let reward = 0;
        const currentFoodDistance = Math.sqrt(
            Math.pow(gameState.foodDirection.x, 2) + 
            Math.pow(gameState.foodDirection.y, 2)
        );

        // Yemek yeme ödülü
        if (moveResult === 1) {
            reward = 5.0;
            this.stepsWithoutFood = 0;
        } else if (window.game.gameOver) {
            reward = -8.0;
        } else {
            // Yemeğe yaklaşma/uzaklaşma ödülü
            if (this.lastFoodDistance && currentFoodDistance < this.lastFoodDistance) {
                reward += 0.4;
            } else if (this.lastFoodDistance && currentFoodDistance > this.lastFoodDistance) {
                reward -= 0.4;
            }

            // Tehlikeli durumlardan kaçınma cezası
            if (gameState.dangerAhead || gameState.dangerLeft || gameState.dangerRight) {
                reward -= 0.1;
            }

            // Tekrarlayan hareketler için ceza
            if (gameState.isRepeatingMoves) {
                reward -= 0.3;
            }

            // Kuyruğa yakınlık cezası
            if (gameState.tailNearby) {
                reward -= 0.2;
            }

            // Uzun süre yemek yememe cezası
            this.stepsWithoutFood++;
            if (this.stepsWithoutFood > this.maxStepsWithoutFood) {
                reward -= 1.0;
                window.game.gameOver = true;
            }
        }

        this.lastFoodDistance = currentFoodDistance;
        this.lastReward = reward;
        return reward;
    }

    async start() {
        this.running = true;
        this.jenerasyon = 0;
        this.totalScore = 0;

        while (this.running) {
            window.game.reset();
            let currentState = this.getState(window.game.getState());
            this.stepsWithoutFood = 0;
            this.lastFoodDistance = null;
            this.lastReward = 0;
            let totalReward = 0;
            
            while (!window.game.gameOver && this.running) {
                const action = await this.predict(currentState);
                const moveResult = window.game.move(this.actionToDirection(action));
                const nextGameState = window.game.getState();
                const nextState = this.getState(nextGameState);
                
                const reward = this.calculateReward(moveResult, nextGameState);
                totalReward += reward;

                this.remember(currentState, action, reward, nextState, window.game.gameOver);
                currentState = nextState;
                
                const loss = await this.replay();
                document.getElementById('loss').textContent = loss ? loss.toFixed(4) : '0';
                
                window.game.draw();
                await new Promise(resolve => setTimeout(resolve, 1000 / window.game.speed));
            }

            this.jenerasyon++;
            this.totalScore += window.game.score;
            
            document.getElementById('score').textContent = window.game.score;
            document.getElementById('jenerasyon').textContent = this.jenerasyon;
            document.getElementById('avgScore').textContent = (this.totalScore / this.jenerasyon).toFixed(2);
            
            console.log(`Jenerasyon ${this.jenerasyon}: Skor = ${window.game.score}, Ortalama Skor = ${(this.totalScore / this.jenerasyon).toFixed(2)}, Epsilon = ${this.epsilon.toFixed(4)}, Toplam Ödül = ${totalReward.toFixed(2)}`);
        }
    }

    stop() {
        this.running = false;
    }
}

// Sayfa yüklendiğinde oyunu ve AI'yı başlat
window.onload = () => {
    window.game = new SnakeGame();
    window.ai = new NeuralNetwork();
}; 