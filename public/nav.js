var Nav = {
    items: [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'search', label: 'Search', icon: 'search' },
        { id: 'library', label: 'Library', icon: 'library' },
        { id: 'profile', label: 'Profil', icon: 'user' }
    ],
    active: 'home',
    particleCount: 26,
    animationTime: 600,
    timeVariance: 400,
    particleR: 440,
    particleDistances: [90, 10],

    render: function() {
        var lis = Nav.items.map(function(it) {
            return '<li id="nav-' + it.id + '" class="nav-item rounded-full relative cursor-pointer flex items-center justify-center nav-inactive-item" onclick="Nav.click(event, \'' + it.id + '\')">' +
                '<a href="#' + it.id + '" onclick="return false;" class="nav-link outline-none inline-flex items-center justify-center gap-2 cursor-pointer select-none touch-manipulation" aria-label="' + it.label + '" title="' + it.label + '">' +
                    '<span class="nav-icon inline-flex items-center justify-center pointer-events-none"><i data-lucide="' + it.icon + '" class="w-6 h-6"></i></span>' +
                    '<span class="nav-label font-black text-xs tracking-wide pointer-events-none select-none hidden">' + it.label + '</span>' +
                '</a>' +
            '</li>';
        }).join('');
        gid('nav-container').innerHTML =
            '<svg style="position:absolute;width:0;height:0;pointer-events:none" aria-hidden="true"><defs><filter id="gooey-nav-filter" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="goo"/><feBlend in="SourceGraphic" in2="goo"/></filter></defs></svg>' +
            '<div class="nav-dock-wrap">' +
                '<div class="nav-dock">' +
                    '<div class="gooey-nav-container select-none" id="gooey-nav-container">' +
                        '<nav class="flex relative" style="z-index:3;transform:translate3d(0,0,0.01px)"><ul id="gooey-nav-list" class="flex list-none p-0 m-0 relative items-center">' + lis + '</ul></nav>' +
                        '<span class="effect" id="gooey-nav-effect"></span>' +
                    '</div>' +
                '</div>' +
            '</div>';
        lucide.createIcons();
        if (window.ResizeObserver) {
            new ResizeObserver(function() {
                var li = gid('nav-' + Nav.active);
                if (li) Nav.moveEffect(li, false);
            }).observe(gid('gooey-nav-container'));
        }
    },

    noise: function(n) {
        n = n || 1;
        return n / 2 - Math.random() * n;
    },

    getXY: function(distance, pointIndex, totalPoints) {
        var angle = ((360 + Nav.noise(8)) / totalPoints) * pointIndex * (Math.PI / 180);
        return [distance * Math.cos(angle), distance * Math.sin(angle)];
    },

    createParticle: function(i, t, d, r) {
        var rotate = Nav.noise(r / 10);
        return {
            start: Nav.getXY(d[0], Nav.particleCount - i, Nav.particleCount),
            end: Nav.getXY(d[1] + Nav.noise(7), Nav.particleCount - i, Nav.particleCount),
            time: t,
            scale: 1 + Nav.noise(0.2),
            rotate: rotate > 0 ? (rotate + r / 20) * 10 : (rotate - r / 20) * 10
        };
    },

    makeParticles: function(element) {
        if (!element) return;
        var bubbleTime = Nav.animationTime * 2 + Nav.timeVariance;
        element.style.setProperty('--time', bubbleTime + 'ms');
        for (var i = 0; i < Nav.particleCount; i++) {
            (function(i) {
                var t = Nav.animationTime * 2 + Nav.noise(Nav.timeVariance * 2);
                var p = Nav.createParticle(i, t, Nav.particleDistances, Nav.particleR);
                setTimeout(function() {
                    var particle = document.createElement('span');
                    var point = document.createElement('span');
                    particle.classList.add('particle');
                    particle.style.setProperty('--start-x', p.start[0] + 'px');
                    particle.style.setProperty('--start-y', p.start[1] + 'px');
                    particle.style.setProperty('--end-x', p.end[0] + 'px');
                    particle.style.setProperty('--end-y', p.end[1] + 'px');
                    particle.style.setProperty('--time', p.time + 'ms');
                    particle.style.setProperty('--scale', String(p.scale));
                    particle.style.setProperty('--rotate', p.rotate + 'deg');
                    point.classList.add('point');
                    particle.appendChild(point);
                    element.appendChild(particle);
                    setTimeout(function() {
                        try { if (particle.parentNode === element) element.removeChild(particle); } catch (e) {}
                    }, t);
                }, 30);
            })(i);
        }
    },

    moveEffect: function(li, animate) {
        var container = gid('gooey-nav-container');
        var effect = gid('gooey-nav-effect');
        if (!container || !effect || !li) return;
        var cr = container.getBoundingClientRect();
        var pos = li.getBoundingClientRect();
        effect.style.left = (pos.x - cr.x) + 'px';
        effect.style.top = (pos.y - cr.y) + 'px';
        effect.style.width = pos.width + 'px';
        effect.style.height = pos.height + 'px';
        effect.classList.remove('active');
        void effect.offsetWidth;
        effect.classList.add('active');
        if (animate) {
            effect.querySelectorAll('.particle').forEach(function(p) {
                try { effect.removeChild(p); } catch (e) {}
            });
            Nav.makeParticles(effect);
        }
    },

    click: function(e, id) {
        App.switch(id);
    },

    setActive: function(id) {
        var prev = Nav.active;
        Nav.active = id;
        Nav.items.forEach(function(it) {
            var li = gid('nav-' + it.id);
            if (!li) return;
            var on = it.id === id;
            li.classList.toggle('active', on);
            li.classList.toggle('nav-inactive-item', !on);
            var label = li.querySelector('.nav-label');
            if (label) {
                label.classList.toggle('hidden', !on);
                label.classList.toggle('inline-block', on);
            }
        });
        var activeLi = gid('nav-' + id);
        if (activeLi) {
            requestAnimationFrame(function() {
                Nav.moveEffect(activeLi, prev !== id || !Nav.shown);
                Nav.shown = true;
            });
        }
    }
};
