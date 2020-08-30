const toStyleString = (style) => Object.entries(style).map((v)=>`${v[0]}: ${(typeof v[1])==='number'? v[1]+'px': v[1]}`).join("; "); 
        
class Square {
    divElem
    style
    x
    y
    constructor(x, y) {
        this.put(x, y)
        this.x = x;
        this.y = y;
    }

    put(x, y) {
        this.divElem = document.createElement("div");
        this.style = {
            position: "absolute",
            width: 20,
            height: 20,
            top: y,
            left: x,
            background: "rgba(192,192,192,0.5)"
        }
        this.divElem.style.cssText = toStyleString(this.style);
        this.divElem.innerHTML = `<span>${x}:${y}</span>`;
        this.divElem.className = "tooltip";
        document.body.insertBefore(this.divElem, window.document.body.firstChild);
    }

    move(v) {
        const moves = {
            'u': ()=>{this.style.top -= 20},
            'd': ()=>{this.style.top += 20},
            'l': ()=>{this.style.left -= 20},
            'r': ()=>{this.style.left += 20}
        }[v]
        moves?.();
        const div20 = (val)=>val - val%20;
        const bottom = div20(window.innerHeight)-20;
        const right = div20(window.innerWidth)-20;
        this.style.top < 0? this.style.top = bottom : this.style.top > bottom? this.style.top = 0: undefined;
        this.style.left < 0 ? this.style.left = right : this.style.left > right? this.style.left = 0: undefined;;
        this.update();
    }

    update() {
        this.x = this.style.left;
        this.y = this.style.top;
        this.divElem.style.cssText = toStyleString(this.style);
        this.divElem.innerHTML = `<span>${this.x}:${this.y}</span>`;
    }

    replace(x, y) {
        this.style.left = x;
        this.style.top = y;
        this.update();
    }

    paintRed(){
        this.style.background = "rgba(255,192,192)";
        this.update();
    }

}  

class AutoSquare {
    square
    currentKey
    handle
    
    constructor(x, y) {
        this.square = new Square(x, y);
    }

    setKey(v) {
        const updateKey = {
            'u':()=>{this.currentKey = v==='d'?this.currentKey:v},
            'd':()=>{this.currentKey = v==='u'?this.currentKey:v},
            'l':()=>{this.currentKey = v==='r'?this.currentKey:v},
            'r':()=>{this.currentKey = v==='l'?this.currentKey:v},
        }[this.currentKey]
        updateKey?.();
        this.currentKey = v;
        // console.log(v);
    }

    update() {
        this.square.move(this.currentKey)
    }
}

class Train {
    length
    moves
    squares
    currentKey
    nextKey
    add
    x
    y
    updatedKey


    constructor(x, y, n) {
        this.moves = [];
        this.length = n;
        this.squares =[];
        this.currentKey = 'd';
        this.nextKey = 'd';
        this.x = x;
        this.y = y;
        this.updatedKey = false;

        for (let i=0;i < n; ++i) {
            this.squares.push(new AutoSquare(x, y+i*20))
            this.moves.push(this.currentKey);
        }
    }


    addSquare() {
        let {x, y} = this.squares[this.squares.length-1].square

        const put = {
            'u': ()=>{y -= 20},
            'd': ()=>{y += 20},
            'l': ()=>{x -= 20},
            'r': ()=>{x += 20}
        }[this.currentKey]
        put?.();   
        this.squares.push(new AutoSquare(x,y));
        this.moves.push(this.currentKey);
        this.length += 1;
    }
    setKey(v) {
        // if (!this.updatedKey) {
            const updateKey = {
                'u':()=>{this.currentKey = v==='d'?this.currentKey:v},
                'l':()=>{this.currentKey = v==='r'?this.currentKey:v},
                'r':()=>{this.currentKey = v==='l'?this.currentKey:v},
                'd':()=>{this.currentKey = v==='u'?this.currentKey:v},
            }[this.currentKey]
            updateKey?.();
            //this.updatedKey = true;
        // }
        
        // console.log(this.currentKey)
    }

    stop() {
        clearInterval(this.handle);
    }

    getCoords() {
        return this.squares.map(v=>v.square).map((s)=>({x:s.x, y:s.y}));
    }

    isIntersected() {
        const dict = this.getCoords()
        .map(v=>`${v.x}:${v.y}`)
        .reduce((obj, val)=>{
            obj[val]===undefined ? obj[val] = 1: obj[val] += 1;
            return obj; 
        }, {});
        return Object.values(dict).some(v=>v>1)
    }
}


class Apple {
    square
    constructor(forbiddenCoords){
        this.square = new Square(...this.getPos(forbiddenCoords));
        this.square.paintRed();
    }

    getPos(forbiddenCoords) {
        const size = [Math.floor(innerWidth/20), Math.floor(innerHeight/20)];
        let position = Math.floor(Math.random() * size[0] * size[1]);
        const forbiddenPos = forbiddenCoords
        .map((v)=>({x:v.x/20, y: v.y/20}))
        .map((v)=>v.x+v.y*size[0]);
        while (forbiddenPos.some((v)=>position===v)) {
            position++;
        }
        // [x, y]
        return [position%size[0] * 20, Math.floor(position/size[0])*20]
    }

    move(forbiddenCoords) {
        this.square.replace(...this.getPos(forbiddenCoords));
    }
}

class Game {
    train
    apple
    handle
    interval = 50
    constructor(){
        this.train = new Train(400, 140, 10);
        this.apple = new Apple(this.train.getCoords());
        document.addEventListener('keydown', (event)=>{
            const callback = {
                "ArrowLeft"  : ()=>{this.train.setKey('l')},
                "ArrowRight" : ()=>{this.train.setKey('r')},
                "ArrowUp"    : ()=>{this.train.setKey('u')},
                "ArrowDown"  : ()=>{this.train.setKey('d')},
                "a": ()=>{this.train.add=true}
            }[event.key]
            callback?.()
            });

        const frames = 10000;
        let i = 0;
        this.handle = setInterval(() => {
            
            // console.log(this.getCoords());
            

            //moves queue
            // this.train.currentKey = this.train.nextKey;
            this.train.moves.push(this.train.currentKey);
            this.train.moves.shift();

            // update moves
            for (let i=0; i < this.train.length; ++i) {
                
                this.train.squares[i].setKey(this.train.moves[i])
                this.train.squares[i].update();
                
            }

            // grow
            const {x, y} = this.train.squares[this.train.squares.length-1].square;
            this.train.x = x;
            this.train.y = y;
            if (this.train.add || this.checkApple()) {
                this.train.add = false;
                this.train.addSquare();
                this.apple.move(this.train.getCoords());
                console.log(this.train.length)
            }

            // self-intersection!!
            if (this.train.isIntersected()) {console.log("intersected"); this.stop()}
            // debug stop
            if (i>frames) {this.stop()}
            i++;
            
            // this.train.updatedKey = false;
        }, this.interval);
    
    }

    stop() {
        clearInterval(this.handle);
    }

    checkApple() {
        const aX = this.apple.square.x,
                aY = this.apple.square.y,
                tX = this.train.x,
                tY = this.train.y;
        
        return aX===tX && aY===tY;
    }
}

const game = new Game();
