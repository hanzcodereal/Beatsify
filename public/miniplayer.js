var MP={
    init(){
        gid('mini-container').innerHTML=`
        <div id="mini-player" class="hidden fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-96 z-[160]" style="bottom:75px;transition:transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);transform:translateY(150px);">
            <div id="mini-player-inner" onclick="FullPlayer.open()" class="rounded-full px-3 py-2 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-all relative overflow-hidden bg-[#12131b] border border-white/10 group">
                <div id="mini-beats-bg" class="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-500 overflow-hidden rounded-full z-0 hidden">
                    <div id="mini-beats-bg-gradient" class="absolute inset-0 transition-all duration-700"></div>
                </div>
                <div class="relative w-11 h-11 shrink-0 flex items-center justify-center z-10" onclick="FullPlayer.open(); if(typeof event !== 'undefined') event.stopPropagation();">
                    <svg class="w-11 h-11 -rotate-90 pointer-events-none absolute inset-0 z-10" viewBox="0 0 48 48">
                        <circle cx="24" cy="24" r="21" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="2.5"></circle>
                        <circle id="mini-circle-progress" cx="24" cy="24" r="21" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-dasharray="131.95" stroke-dashoffset="131.95" stroke-linecap="round" class="transition-all duration-150"></circle>
                    </svg>
                    <div class="w-[34px] h-[34px] rounded-full overflow-hidden z-0 border border-white/10">
                        <img id="mini-cover" src="" class="w-full h-full object-cover rounded-full spin-record" style="animation-play-state: paused;" />
                    </div>
                </div>
                <div class="flex-1 min-w-0 z-10">
                    <div id="mini-title" class="font-bold text-xs sm:text-sm text-white truncate drop-shadow-sm">Pilih lagu</div>
                    <div id="mini-artist" class="text-[#a0a5b0] text-[11px] truncate mt-0.5"></div>
                </div>
                <div class="flex items-center gap-1.5 z-10 shrink-0">
                    <button onclick="TP(); if(typeof event !== 'undefined') event.stopPropagation();" class="text-white active:scale-90 p-0.5 cursor-pointer" title="Putar/Jeda">
                        <div id="mini-play-btn" class="w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/10 border border-white/20 hover:bg-white/20">
                            <i data-lucide="play" class="w-4 h-4 fill-current ml-0.5"></i>
                        </div>
                    </button>
                    <button id="mini-like-btn" onclick="toggleCurrentLike(); if(typeof event !== 'undefined') event.stopPropagation();" class="text-[#a0a5b0] hover:text-rose-400 active:scale-90 p-1.5 cursor-pointer" title="Sukai Lagu">
                        <i data-lucide="heart" class="w-5 h-5"></i>
                    </button>
                </div>
            </div>
        </div>`;
        lucide.createIcons();
    },
    show(){
        if (!S || !S.ct || (!S.ct.id && !S.ct.videoId && !S.ct.title)) {
            return;
        }
        var mp=gid('mini-player');
        if(!mp) return;
        mp.classList.remove('hidden');
        requestAnimationFrame(function(){mp.style.transform='translateY(0)';});
        if (typeof S !== 'undefined' && S.ct) {
            MP.updateBeats(S.ct);
        }
    },
    hide(){
        var mp=gid('mini-player');
        if(!mp) return;
        mp.style.transform='translateY(150px)';
        setTimeout(function(){mp.classList.add('hidden');},300);
    },
    getTrackColors(track) {
        if (!track) return ['#ff2a5f', '#ff5e82', '#cc1b47', '#ff4070'];
        var str = (track.videoId || '') + (track.title || '') + (track.artist || '');
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        hash = Math.abs(hash);
        var hue = hash % 360;
        return [
            'hsl(' + hue + ', 85%, 55%)',
            'hsl(' + hue + ', 95%, 68%)',
            'hsl(' + hue + ', 75%, 42%)',
            'hsl(' + hue + ', 88%, 60%)'
        ];
    },
    applyColors(colors) {
        if (!colors || !colors.length) return;
        var primary = colors[0];
        var secondary = colors[1] || primary;
        var tertiary = colors[2] || primary;
        var inner = gid("mini-player-inner");
        if (inner) inner.style.background = "linear-gradient(to right, " + "color-mix(in srgb, " + tertiary + " 30%, #12131b), #12131b 80%)";
        if (typeof S !== 'undefined') S.currentAccentColor = primary;

        var circleProgress = gid('mini-circle-progress');
        if (circleProgress) circleProgress.style.stroke = primary;

        var playBtn = gid('mini-play-btn');
        if (playBtn) {
            playBtn.style.borderColor = "color-mix(in srgb, " + primary + " 40%, transparent)";
        }

        var beatBars = document.querySelectorAll('.mini-beat-bar');
        beatBars.forEach(function(bar, idx) {
            bar.style.backgroundColor = (idx % 2 === 0) ? primary : secondary;
        });

        var beatsGradient = gid('mini-beats-bg-gradient');
        if (beatsGradient) {
            beatsGradient.style.background = 'linear-gradient(to right, color-mix(in srgb, ' + primary + ' 25%, transparent), color-mix(in srgb, ' + secondary + ' 15%, transparent), transparent)';
        }

        if (typeof FullPlayer !== 'undefined' && FullPlayer.applyColors) {
            FullPlayer.applyColors(colors);
        }
    },
    extractFromImage(img) {
        try {
            var canvas = document.createElement('canvas');
            canvas.width = 16;
            canvas.height = 16;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, 16, 16);
            var imgData = ctx.getImageData(0, 0, 16, 16).data;
            
            var totalR = 0, totalG = 0, totalB = 0;
            var maxSat = -1;
            var bestR = 255, bestG = 42, bestB = 95;
            
            for (var i = 0; i < imgData.length; i += 4) {
                var r = imgData[i];
                var g = imgData[i+1];
                var b = imgData[i+2];
                
                totalR += r;
                totalG += g;
                totalB += b;
                
                var maxC = Math.max(r, g, b);
                var minC = Math.min(r, g, b);
                var sat = maxC - minC;
                
                if (sat > maxSat && maxC > 50 && minC < 220) {
                    maxSat = sat;
                    bestR = r;
                    bestG = g;
                    bestB = b;
                }
            }
            
            var count = imgData.length / 4;
            var avgR = Math.round(totalR / count);
            var avgG = Math.round(totalG / count);
            var avgB = Math.round(totalB / count);
            
            var mainR = (maxSat > 30) ? bestR : (Math.max(avgR, avgG, avgB) < 40 ? 220 : avgR);
            var mainG = (maxSat > 30) ? bestG : (Math.max(avgR, avgG, avgB) < 40 ? 100 : avgG);
            var mainB = (maxSat > 30) ? bestB : (Math.max(avgR, avgG, avgB) < 40 ? 140 : avgB);
            
            var c1 = 'rgb(' + mainR + ',' + mainG + ',' + mainB + ')';
            var c2 = 'rgb(' + Math.min(255, Math.round(mainR * 1.25 + 20)) + ',' + Math.min(255, Math.round(mainG * 1.25 + 20)) + ',' + Math.min(255, Math.round(mainB * 1.25 + 20)) + ')';
            var c3 = 'rgb(' + Math.max(30, Math.round(mainR * 0.75)) + ',' + Math.max(30, Math.round(mainG * 0.75)) + ',' + Math.max(30, Math.round(mainB * 0.75)) + ')';
            var c4 = 'rgb(' + Math.min(255, Math.round(mainR * 1.1 + 10)) + ',' + Math.min(255, Math.round(mainG * 1.1 + 10)) + ',' + Math.min(255, Math.round(mainB * 1.1 + 10)) + ')';
            
            return [c1, c2, c3, c4];
        } catch(e) {
            return null;
        }
    },
    updateBeats(track) {
        if (!track) return;
        var palette = MP.getTrackColors(track);
        MP.applyColors(palette);

        if (track.cover && track.cover.startsWith('http')) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = track.cover;
            img.onload = function() {
                var colors = MP.extractFromImage(img);
                if (colors) {
                    MP.applyColors(colors);
                    if (typeof FullPlayer !== 'undefined' && FullPlayer.applyColors) {
                        FullPlayer.applyColors(colors);
                    }
                }
            };
        }
    }
};