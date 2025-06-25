//Код определяющий на каком устройстве открыта страница
const isMobile = {
    Android: function () {
        return navigator.userAgent.match(/Android/i);
    },
    BlackBerry: function () {
        return navigator.userAgent.match(/BlackBerry/i);
    },
    iOS: function () {
        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
    },
    Opera: function () {
        return navigator.userAgent.match(/Opera Mini/i);
    },
    Windows: function () {
        return navigator.userAgent.match(/IEMobile/i);
    },
    any: function () {
        return (
            isMobile.Android() ||
            isMobile.BlackBerry() ||
            isMobile.iOS() ||
            isMobile.Opera() ||
            isMobile.Windows()
        );
    }
};

//Если это мобильное устройство (одно из)
if(isMobile.any()) {
    document.body.classList.add('_touch');

    //Стрелочка
    let menuArrows = document.querySelectorAll('.menu__arrow');
    if(menuArrows.length > 0) {
        for(let index of menuArrows) {
            const menuArrows = index;
            menuArrows.addEventListener("click", function(e) {
                menuArrows.parentElement.classList.toggle('_active');
            });
        }
    }
} else {
    document.body.classList.add('_pc');
}

//-------Меню бургер-----------
const iconMenu = document.querySelector('.menu__icon');
const menuBody = document.querySelector('.menu__body');

if(iconMenu) {
    iconMenu.addEventListener("click", function(e) {
        document.body.classList.toggle('_lock');
        iconMenu.classList.toggle('_active');
        menuBody.classList.toggle('_active');
    })
}


//--------Прокрутка при клике---------
//Находим все элементы с классов menu__link и атрибутом data-goto
const menuLinks = document.querySelectorAll('.menu__link[data-goto]');

if(menuLinks.length > 0) {
    menuLinks.forEach((element) => {
        element.addEventListener("click", onMenuLinkClick);
    });
    
    function onMenuLinkClick(e) {
        //Получаем элемент по которому кликнули
        const menuLink = e.target;
        //Проверяем заполнен ли dataset атрибут а также проверить существует ли объект на который ссылается данный dataset атрибут
        if(menuLink.dataset.goto && document.querySelector(menuLink.dataset.goto)) {
            //page__section_1, page__section_2, page__section_3
            const gotoBlock = document.querySelector(menuLink.dataset.goto);
            //Высчитываем положение этого элемента на странице (gotoBlock.getBoundingClientRect().top) + количество прокрученных пикселей (pageYOffset) - Высота шапки (document.querySelector('header').offsetHeight)
            const gotoBlockValue = gotoBlock.getBoundingClientRect().top + pageYOffset -document.querySelector('header').offsetHeight;

            //Проверка если у иконки меню есть класс active т.е. она открыта 
            if(iconMenu.classList.contains('_active')) {
                document.body.classList.remove('_lock');
                iconMenu.classList.remove('_active');
                menuBody.classList.remove('_active');
            }


            //Заставим scroll прокрутиться
            window.scrollTo({
                top:gotoBlockValue,
                behavior: "smooth"
            });
            //Отключаем действие ссылки по умолчанию
            e.preventDefault();
        }
    }
}