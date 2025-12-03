import { ResultOption } from "@/types"

type ResultOptionListProps = {
    resultOptions:ResultOption[0]
    setResultOptions:ResultOption[1]
}
export function ResultOptionList(props:ResultOptionListProps) {
    return (
        <ul>
            <li className="result-option-item">
                <input 
                    type="checkbox" 
                    checked={props.resultOptions.includesMusic} 
                    onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                        props.setResultOptions.setIncludesMusic(e.target.checked);
                    }}
                />
                <span>원곡</span>
            </li>
            <li className="result-option-item">
                <input 
                    type="checkbox" 
                    checked={props.resultOptions.includesMR}
                    onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                        props.setResultOptions.setIncludesMR(e.target.checked);
                    }}
                />
                <span>MR</span>
            </li>
            <li className="result-option-item">
                <input 
                    type="checkbox" 
                    checked={props.resultOptions.includesMelodicMR}
                    onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                        props.setResultOptions.setIncludesMelodicMR(e.target.checked);
                    }}    
                />
                <span>보컬 멜로디 반주</span>
            </li>
            <li className="result-option-item">
                <input type="checkbox" checked disabled/>
                <span>노래방 영상</span>
            </li>
            <li className="result-option-item">
                <input 
                    type="checkbox"
                    checked={props.resultOptions.includesSingAlong}
                    onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                        props.setResultOptions.setIncludesSingAlong(e.target.checked);
                    }}                
                />
                <span>따라부르기 영상</span>
            </li>
            <li className="result-option-item">
                <input 
                    type="checkbox"
                    checked={props.resultOptions.includesMelodicKaraoke}
                    onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                        props.setResultOptions.setIncludesMelodicKaraoke(e.target.checked);
                    }}
                />
                <span>보컬 멜로디 노래방 영상</span>
            </li>
            <li className="result-option-item">
                <input 
                    type="checkbox"
                    checked={props.resultOptions.includesData}
                    onChange={(e:React.ChangeEvent<HTMLInputElement>) => {
                        props.setResultOptions.setIncludesData(e.target.checked);
                    }}
                />
                <span>싱크 데이터</span>
            </li>
        </ul>
    )
}