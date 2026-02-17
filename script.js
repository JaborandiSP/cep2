// ===== NORMALIZAR =====
function normalizar(texto){
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ===== LEVENSHTEIN =====
function levenshtein(a, b) {
    const m = Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++) m[i][0]=i;
    for(let j=0;j<=b.length;j++) m[0][j]=j;

    for(let i=1;i<=a.length;i++){
        for(let j=1;j<=b.length;j++){
            const c = a[i-1]===b[j-1]?0:1;
            m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+c);
        }
    }
    return m[a.length][b.length];
}

// ===== DADOS (cole sua lista aqui) =====
const dados = [

];

// ===== ELEMENTOS =====
const resultsDiv = document.getElementById("results");
const contador = document.getElementById("contador");
const searchInput = document.getElementById("search");
const autoDiv = document.getElementById("autocomplete");

// ===== DESTACAR =====
function destacar(texto, termo){
    if(!termo) return texto;
    const norm = normalizar(texto);
    const palavras = normalizar(termo).split(" ").filter(p=>p.length>0);

    let marcacoes = [];
    palavras.forEach(p=>{
        let i=0;
        while((i=norm.indexOf(p,i))!=-1){
            marcacoes.push({i,f:i+p.length});
            i+=p.length;
        }
    });

    marcacoes.sort((a,b)=>a.i-b.i||b.f-a.f);

    let res="",u=0;
    marcacoes.forEach(m=>{
        res+=texto.slice(u,m.i)+"<span class='highlight'>"+texto.slice(m.i,m.f)+"</span>";
        u=m.f;
    });
    return res+texto.slice(u);
}

// ===== RENDER =====
function render(lista, termo=""){
    resultsDiv.innerHTML="";
    contador.innerHTML = lista.length + " resultado(s)";

    lista.forEach(item=>{
        resultsDiv.innerHTML += `
        <div class="card">
            <b>${destacar(item.logradouro, termo)}</b><br>
            ${destacar(item.bairro, termo)}
            <div class="cep">
            CEP: ${destacar(item.cep, termo)}
            <button onclick="navigator.clipboard.writeText('${item.cep}')">📋</button>
            <br>
            <a target="_blank" href="https://www.google.com/maps/search/${encodeURIComponent(item.logradouro+' Jaborandi SP')}">🗺️ Mapa</a>
            </div>
        </div>`;
    });
}

// ===== BUSCA ULTRA =====
searchInput.addEventListener("input", function(){
    const termoOriginal = this.value.trim();
    const termo = normalizar(termoOriginal);
    autoDiv.innerHTML="";

    if(termo.length<2){
        render(dados);
        return;
    }

    // autocomplete
    dados.filter(d=>normalizar(d.logradouro).includes(termo))
        .slice(0,5)
        .forEach(s=>{
            let div=document.createElement("div");
            div.className="auto-item";
            div.innerText=s.logradouro;
            div.onclick=()=>{
                searchInput.value=s.logradouro;
                autoDiv.innerHTML="";
                searchInput.dispatchEvent(new Event("input"));
            };
            autoDiv.appendChild(div);
        });

    const filtrado = dados.map(item=>{
        const texto = normalizar(item.logradouro+" "+item.bairro+" "+item.cep);
        let score=0;
        termo.split(" ").forEach(p=>{
            if(texto.includes(p)) score+=10;
            texto.split(" ").forEach(t=>{
                if(levenshtein(p,t)<=2) score+=2;
            });
        });
        return {item,score};
    })
    .filter(r=>r.score>0)
    .sort((a,b)=>b.score-a.score)
    .map(r=>r.item);

    render(filtrado, termoOriginal);
});

// inicial
render(dados);
