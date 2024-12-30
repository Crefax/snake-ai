class QLearning {
    constructor() {
        this.qTable = new Map();
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.epsilon = 0.1;
        this.iterations = 0;
        this.totalScore = 0;
        this.running = false;
        this.actions = ['forward', 'left', 'right'];

        this.setupUI();
    }

    setupUI() {
        document.getElementById('startAI').addEventListener('click', () => this.start());
        document.getElementById('stopAI').addEventListener('click', () => this.stop());
    }

    getStateKey(state) {
        return `${state.foodDirection.x},${state.foodDirection.y},${state.dangerAhead},${state.dangerLeft},${state.dangerRight}`;
    }

    getQValue(stateKey, action) {
        const key = `${stateKey},${action}`;
        return this.qTable.get(key) || 0;
    }

    setQValue(stateKey, action, value) {
        const key = `${stateKey},${action}`;
        this.qTable.set(key, value);
    }

    chooseAction(state) {
        if (Math.random() < this.epsilon) {
            return this.actions[Math.floor(Math.random() * this.actions.length)];
        }

        const stateKey = this.getStateKey(state);
        let bestAction = this.actions[0];
        let bestValue = this.getQValue(stateKey, bestAction);

        for (const action of this.actions) {
            const value = this.getQValue(stateKey, action);
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }

        return bestAction;
    }

    updateQValue(state, action, reward, nextState) {
        const stateKey = this.getStateKey(state);
        const nextStateKey = this.getStateKey(nextState);
        
        let maxNextQ = Math.max(...this.actions.map(a => this.getQValue(nextStateKey, a)));
        
        const oldQ = this.getQValue(stateKey, action);
        const newQ = oldQ + this.learningRate * (reward + this.discountFactor * maxNextQ - oldQ);
        
        this.setQValue(stateKey, action, newQ);
    }

    async start() {
        this.running = true;
        this.iterations = 0;
        this.totalScore = 0;

        while (this.running) {
            game.reset();
            let currentState = game.getState();
            
            while (!game.gameOver && this.running) {
                const action = this.chooseAction(currentState);
                const reward = game.move(action);
                const nextState = game.getState();
                
                this.updateQValue(currentState, action, reward, nextState);
                currentState = nextState;
                
                game.draw();
                
                await new Promise(resolve => setTimeout(resolve, 1000 / game.speed));
            }

            this.iterations++;
            this.totalScore += game.score;
            
            document.getElementById('score').textContent = game.score;
            document.getElementById('iteration').textContent = this.iterations;
            document.getElementById('avgScore').textContent = (this.totalScore / this.iterations).toFixed(2);
            
            console.log(`İterasyon ${this.iterations}: Skor = ${game.score}, Ortalama Skor = ${(this.totalScore / this.iterations).toFixed(2)}`);
        }
    }

    stop() {
        this.running = false;
    }
}

const ai = new QLearning(); 