export class Article<T>{
    private data:T[][];
    constructor(data:T[][]){
        this.data = data;
    }
    get lastIndex(){
        return [this.data.length - 1, this.data[this.data.length - 1].length - 1] as [number, number];
    }
    insertLine(index:number, ...values:T[][]){
        this.data.splice(index, 0, ...values);
    }
    removeLine(index:number){
        this.data.splice(index, 1);
    }
    at(index:[number, number]){
        return this.data[index[0]]?.[index[1]];
    }
    lineAt(index:number){
        return this.data[index];
    }
    prev(index:[number, number]){
        const idx = this.prevIndex(index);
        return this.data[idx[0]]?.[idx[1]];
    }
    prevIndex(index:[number, number]){
        if (index[1] >= 1) return [index[0], index[1] - 1] as [number, number];
        else return [index[0] - 1, (this.data[index[0] - 1]?.length ?? 0) - 1] as [number, number];
    }
    next(index:[number, number]){
        const idx = this.nextIndex(index);
        return this.data[idx[0]]?.[idx[1]];
    }
    nextIndex(index:[number, number]){
        if (index[1] < this.data[index[0]].length - 1) return [index[0], index[1] + 1] as [number, number];
        else return [index[0] + 1, 0] as [number, number];
    }
    map<U>(func:(value:T[], index:number, array:T[][]) => U){
        return this.data.map(func);
    }
    findIndex(func:(value:T) => boolean){
        const idx1 = this.data.findIndex(l => l.some(func));
        const idx2 = this.data[idx1]?.findIndex(func) ?? -1;

        return [idx1, idx2] as [number, number];
    }
    findLastIndex(func:(value:T) => boolean){
        const idx1 = this.data.findLastIndex(l => l.some(func));
        const idx2 = this.data[idx1]?.findLastIndex(func) ?? -1;
        
        return [idx1, idx2] as [number, number];
    }
}