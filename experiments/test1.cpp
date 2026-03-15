#include <bits/stdc++.h>
using namespace std;

int main(){
    int n;
    cin >> n;
    vector<int> a(n);
    for (auto& i: a) cin >> i;

    for (int i = 0; i < n; i++) {
        for (int j = 0; j < n; j++) {
            cout << a[i] << " " << a[j] << endl;
        }
    }

    return 0;
}