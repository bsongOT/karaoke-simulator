import { Product } from "@/types";

export class ProcessHandler {
    private __process:string;
    public get process(){
        return this.__process;
    }
    private set process(v){
        this.__process = v;
    }

    constructor(){
        this.__process = "fetchMusic";
    }

    public async submit(product:Product){

    }
    public async build(product:Product){

    }
    private fetchMusic(){

    }
    private fetchMR(){

    }
    private fetchMelody(){

    }
}