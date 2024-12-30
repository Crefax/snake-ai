class SnakeGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 400;
        this.canvas.height = 400;
        this.gridSize = 20;
        this.snake = [{x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}, {x: 1, y: 4}];
        this.direction = 'right';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('snakeHighScore')) || 0;
        this.updateHighScoreDisplay();
        this.gameOver = false;
        this.speed = 10;
        this.lastMoves = new Array(10).fill('forward');
        this.speedRange = document.getElementById('speedRange');
        this.speedRange.addEventListener('input', () => {
            this.speed = parseInt(this.speedRange.value);
        });
        this.food = this.generateFood();
    }

    generateFood() {
        let food;
        let maxAttempts = 100;
        let attempts = 0;
        let minDistance = 3;
        
        do {
            food = {
                x: Math.floor(Math.random() * (this.canvas.width / this.gridSize)),
                y: Math.floor(Math.random() * (this.canvas.height / this.gridSize))
            };
            
            const head = this.snake[0];
            const distance = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
            
            attempts++;
            if (attempts >= maxAttempts) {
                // Eğer maksimum denemeye ulaşıldıysa, en son bulunan konumu kullan
                break;
            }
            
        } while (
            this.snake.some(segment => segment.x === food.x && segment.y === food.y) ||
            Math.abs(food.x - this.snake[0].x) + Math.abs(food.y - this.snake[0].y) < minDistance
        );
        
        return food;
    }

    getState() {
        const head = this.snake[0];
        const foodDist = {
            x: this.food.x - head.x,
            y: this.food.y - head.y
        };
        
        // Yılanın kendi kuyruğuna yakınlığını kontrol et
        const tailProximity = this.snake.slice(1).some(segment => 
            Math.abs(segment.x - head.x) + Math.abs(segment.y - head.y) <= 2
        );
        
        // Son hareketlerde tekrar olup olmadığını kontrol et
        const isRepeatingMoves = this.lastMoves.every(move => move === this.lastMoves[0]);
        
        return {
            foodDirection: foodDist,
            foodDistance: Math.sqrt(foodDist.x * foodDist.x + foodDist.y * foodDist.y),
            dangerAhead: this.checkDanger('forward'),
            dangerLeft: this.checkDanger('left'),
            dangerRight: this.checkDanger('right'),
            tailNearby: tailProximity,
            isRepeatingMoves: isRepeatingMoves
        };
    }

    checkDanger(direction) {
        const head = {...this.snake[0]};
        const nextDirection = this.getRelativeDirection(direction);
        
        switch(nextDirection) {
            case 'right': head.x++; break;
            case 'left': head.x--; break;
            case 'up': head.y--; break;
            case 'down': head.y++; break;
        }
        
        return this.isCollision(head);
    }

    getRelativeDirection(relative) {
        const directions = ['up', 'right', 'down', 'left'];
        const currentIndex = directions.indexOf(this.direction);
        
        switch(relative) {
            case 'forward': return this.direction;
            case 'left': return directions[(currentIndex + 3) % 4];
            case 'right': return directions[(currentIndex + 1) % 4];
            default: return this.direction;
        }
    }

    isCollision(position) {
        // Duvarlarla çarpışma kontrolü
        if (position.x < 0 || 
            position.x >= this.canvas.width / this.gridSize ||
            position.y < 0 || 
            position.y >= this.canvas.height / this.gridSize) {
            return true;
        }
        
        // Yılanın kendisiyle çarpışma kontrolü
        return this.snake.some(segment => segment.x === position.x && segment.y === position.y);
    }

    move(action) {
        if (this.gameOver) return;

        const head = {...this.snake[0]};
        
        // Son hareketleri güncelle
        this.lastMoves.shift();
        this.lastMoves.push(action);
        
        // Yönü güncelle
        switch(action) {
            case 'forward': break;
            case 'left':
                this.direction = this.getRelativeDirection('left');
                break;
            case 'right':
                this.direction = this.getRelativeDirection('right');
                break;
        }

        // Yeni pozisyonu hesapla
        switch(this.direction) {
            case 'right': head.x++; break;
            case 'left': head.x--; break;
            case 'up': head.y--; break;
            case 'down': head.y++; break;
        }

        // Çarpışma kontrolü
        if (this.isCollision(head)) {
            this.gameOver = true;
            return -1;
        }

        // Yılanı hareket ettir
        this.snake.unshift(head);

        // Yemek kontrolü
        if (head.x === this.food.x && head.y === this.food.y) {
            this.score++;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('snakeHighScore', this.highScore);
                this.updateHighScoreDisplay();
            }
            this.food = this.generateFood();
            return 1;
        } else {
            this.snake.pop();
            return 0;
        }
    }

    draw() {
        // Kanvası temizle
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid çiz
        this.ctx.strokeStyle = '#a0a0a0';
        this.ctx.lineWidth = 0.5;
        
        // Dikey çizgiler
        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        // Yatay çizgiler
        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        // Yılanı çiz
        this.snake.forEach((segment, index) => {
            // Gölge efekti
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            this.ctx.fillRect(
                segment.x * this.gridSize + 2,
                segment.y * this.gridSize + 2,
                this.gridSize - 1,
                this.gridSize - 1
            );
            
            // Yılan parçası
            this.ctx.fillStyle = index === 0 ? '#4CAF50' : '#2E7D32';
            this.ctx.fillRect(
                segment.x * this.gridSize,
                segment.y * this.gridSize,
                this.gridSize - 1,
                this.gridSize - 1
            );
        });

        // Yemeği çiz
        this.ctx.fillStyle = '#CC0B0B';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize/2,
            this.food.y * this.gridSize + this.gridSize/2,
            this.gridSize/2 - 1,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Skor gösterimi
        this.ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--canvas-text');
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(`Skor: ${this.score}`, 10, 10);
    }

    updateHighScoreDisplay() {
        const highScoreElement = document.getElementById('highScore');
        if (highScoreElement) {
            highScoreElement.textContent = this.highScore;
        }
    }

    reset() {
        this.snake = [{x: 4, y: 4}, {x: 3, y: 4}, {x: 2, y: 4}, {x: 1, y: 4}];
        this.direction = 'right';
        this.score = 0;
        this.gameOver = false;
        this.food = this.generateFood();
        this.lastMoves = new Array(10).fill('forward');
        this.updateHighScoreDisplay();
    }
}

const game = new SnakeGame(); 